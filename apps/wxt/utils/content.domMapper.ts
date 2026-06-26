type Rect = { x: number, y: number, width: number, height: number };
type TagWeight = { canopy: number, trellis: number, post: number };

// anchor descriptions
// canopy: short and wide divs for leafy overheads
// trellis: tall narrow divs, for monkeys to climb on
// post: divs that don't scroll away, use as tree trunks/pathways/swamps
type AnchorCategory = 'canopy' | 'trellis' | 'post';

// data about an element's geometry
interface GeometryDataItem {
    element: HTMLElement;
    depth: number;
    position: string;
    viewport: Rect;
    document: Rect;
};

// add the element's score and the raw data used to make that score
interface ScoredDataItem extends GeometryDataItem {
    rawSignals: {
        normalizedArea: number;
        narrowness: number;
        positionTypeScore: number;
        depthScore: number;
        tagWeight: TagWeight;
    };
    scores: TagWeight;
};

// add the final category that was chosen for the element and its score in that category
interface ClassifiedDataItem extends ScoredDataItem {
    category: AnchorCategory;
    categoryScore: number;
};

// domMapper will return the final list of chosen anchor elements
type DomMapResult = { anchors: ClassifiedDataItem[] };

// immediatly deny elements with these tags
const TAG_DENYLIST = new Set(['SCRIPT', 'STYLE', 'META', 'LINK', 'NOSCRIPT', 'TEMPLATE']);

// give tags weights based on what they are most likely to be
const DEFAULT_TAG_WEIGHT: TagWeight = { canopy: 0.3, trellis: 0.3, post: 0.3 };
const TAG_WEIGHTS: Record<string, TagWeight> = {
    NAV: { canopy: 0.1, trellis: 0.8, post: 0.2 },
    HEADER: { canopy: 0.1, trellis: 0.1, post: 0.7 },
    FOOTER: { canopy: 0.1, trellis: 0.1, post: 0.6 },
    SECTION: { canopy: 0.6, trellis: 0.2, post: 0.1 },
    ARTICLE: { canopy: 0.7, trellis: 0.1, post: 0.1 },
    ASIDE: { canopy: 0.2, trellis: 0.5, post: 0.2 },
};

// the ideal depth and depth spread will be used to
// try to pick dom elements that are at the ideal
// nested level, change these numbers throughout testing
const IDEAL_DEPTH = 6;
const DEPTH_SPREAD = 6;

// if an element has these position types, it will always be a post
const POST_POSITION_TYPES = new Set(['fixed', 'sticky']);

// the weights that each anchor category gives to aspects of an element when 
// the element's score is decided for that category
const CANOPY_WEIGHTS = { area: 0.5, narrowness: 0.2, depth: 0.2, tag: 0.1 };
const TRELLIS_WEIGHTS = { narrowness: 0.4, depth: 0.3, tag: 0.3 };
const POST_WEIGHTS = { position: 0.6, depth: 0.2, tag: 0.2 };

const QUALIFY_THRESHOLD = 0.35; // minimum winning score for an element to anchor anything
const TOP_N_PER_CATEGORY: TagWeight = { canopy: 20, trellis: 12, post: 6 }; // max anchors kept per category (reusing TagWeight type since keys match)
const CHUNK_TIME_BUDGET_MS = 8; // ms per idle slice before yielding

// anchors are keyed by element so the renderer can read anchor data without
// rescanning. weakmaps can't be bulk-cleared, so a fresh scan just overwrites by key and
// stale elements fall out via garbage collection. the full ClassifiedDataItem is stored, 
// so a later retuning pass can recompute scores from the stored raw signals without
// re-walking the dom.
export const anchorMap = new WeakMap<HTMLElement, ClassifiedDataItem>();

/**
 * Returns true if the element is hidden and/or is in TAG_DENYLIST.
 * @param element The HTML element to check.
 * @returns
 */
const isRejected = (element: HTMLElement) => {
    if (TAG_DENYLIST.has(element.tagName)) return true;
    if (element.hidden || element.getAttribute('aria-hidden') === 'true' || element.inert) return true;
    if (!element.checkVisibility()) return true;
    return false;
}

/**
 * Gets the weights associated with the given element's tag, or the default tag weights
 * if there are no pre-defined weights for this element in TAG_WEIGHTS.
 * @param element The HTML element to get the weight of.
 * @returns
 */
const getTagWeight = (element: HTMLElement) => {
    return TAG_WEIGHTS[element.tagName] ?? DEFAULT_TAG_WEIGHT;
}

/**
 * Get a score from 0 to 1 based on how close 'depth' is to IDEAL_DEPTH.
 * @param {number} depth 
 * @returns {number}
 */
const getDepthScore = (depth: number) => {
    const raw = 1 - Math.abs(depth - IDEAL_DEPTH) / DEPTH_SPREAD;
    return Math.max(0, Math.min(1, raw));
}

/**
 * Get the normalized area of a viewport in reference to the window
 * @param viewport 
 * @returns
 */
const getNormalizedArea = (viewport: Rect) => {
    const viewportArea = window.innerWidth * window.innerHeight;
    const elementArea = viewport.width * viewport.height;
    return Math.min(1, elementArea / viewportArea)
}

/**
 * Get the narrowness of a viewport.
 * @param viewport 
 * @returns
 */
const getNarrowness = (viewport: Rect) => {
    const longSide = Math.max(viewport.width, viewport.height);
    const shortSide = Math.min(viewport.width, viewport.height);
    
    if (longSide === 0) return 0;
    return 1 - shortSide / longSide;
}

/**
 * Derrive a score based on position style types.
 * At the moment, only posts consider position.
 * @param position 
 * @returns 
 */
const getPositionTypeScore = (position: string) => {
    return POST_POSITION_TYPES.has(position) ? 1 : 0;
}

/**
 * Get an element's scores given its geometry data.
 * @param candidate 
 */
const scoreElement = (candidate: GeometryDataItem): ScoredDataItem => {
    const { element, viewport, position, depth } = candidate;

    const normalizedArea = getNormalizedArea(viewport);
    const narrowness = getNarrowness(viewport);
    const positionTypeScore = getPositionTypeScore(position);
    const depthScore = getDepthScore(depth);
    const tagWeight = getTagWeight(element);

    const canopy =
        CANOPY_WEIGHTS.area * normalizedArea +
        CANOPY_WEIGHTS.narrowness * (1 - narrowness) + 
        CANOPY_WEIGHTS.depth * depthScore +
        CANOPY_WEIGHTS.tag * tagWeight.canopy;

    const trellis =
        TRELLIS_WEIGHTS.narrowness * narrowness +
        TRELLIS_WEIGHTS.depth * depthScore +
        TRELLIS_WEIGHTS.tag * tagWeight.trellis;

    const post =
        POST_WEIGHTS.position * positionTypeScore +
        POST_WEIGHTS.depth * depthScore +
        POST_WEIGHTS.tag * tagWeight.post;

    return {
        ...candidate,
        rawSignals: { normalizedArea, narrowness, positionTypeScore, depthScore, tagWeight },
        scores: { canopy, trellis, post },
    };
}

/**
 * Pick the winning category for an element given its score data.
 * Drop elements that don't score high enough in any category
 * @param item 
 * @returns 
 */
const classifyElement = (item: ScoredDataItem): ClassifiedDataItem | null => {
    const { canopy, trellis, post } = item.scores;

    let category: AnchorCategory = 'canopy';
    let categoryScore = canopy;
    if (trellis > categoryScore) { category = 'trellis'; categoryScore = trellis; }
    if (post > categoryScore) { category = 'post'; categoryScore = post; }

    if (categoryScore < QUALIFY_THRESHOLD) return null;
    return { ...item, category, categoryScore };
}

/**
 * Given the scores for the elements, pick the elements categories
 * and keep the top N results for each category.
 * @param scored 
 * @returns 
 */
const classifyCandidates = (scored: ScoredDataItem[]): ClassifiedDataItem[] => {
    // pick a category for each element that scores high enough, then drop the rest
    const qualified = scored
        .map(classifyElement)
        .filter((i): i is ClassifiedDataItem => i !== null);

    // sort the qualifying elements into buckets based on their categories
    const byCategory: Record<AnchorCategory, ClassifiedDataItem[]> = { canopy: [], trellis: [], post: [] };
    for (const item of qualified) {
        byCategory[item.category].push(item);
    }

    // pick the top n elements to keep from each category
    // n is defined for each category in the object TOP_N_PER_CATEGORY
    const trimmed = Array<ClassifiedDataItem>();
    for (const category of Object.keys(byCategory) as AnchorCategory[]) {
        const group = byCategory[category]
            .sort((a, b) => b.categoryScore - a.categoryScore)
            .slice(0, TOP_N_PER_CATEGORY[category]);
        trimmed.push(...group);
    }

    return trimmed;
}

/**
 * Stash each classified anchor by its element.
 * @param classified
 */
const writeAnchorMap = (classified: ClassifiedDataItem[]) => {
    for (const item of classified) {
        anchorMap.set(item.element, item);
    }
}

/**
 * Run heavy work in idle slices.
 * @param cb 
 * @returns 
 */
const requestIdle = (cb: IdleRequestCallback): number => {
    if (typeof window.requestIdleCallback === 'function') return window.requestIdleCallback(cb);
    // synthesize a deadline so the same call shape works in the fallback path
    return window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 1);
}

/**
 * domMapper makes a map of the DOM and finds locations to anchor animations and textures to.
 * @returns {Promise<DomMapResult>}
 */
export const domMapper = async (): Promise<DomMapResult> => {
    // traverse the dom with iterative dfs to get all of the dom elements
    const candidates = Array<{ element: HTMLElement, depth: number }>();
    const stack = Array<{ element: HTMLElement, depth: number }>();
    stack.push({ element: document.body, depth: 0 });

    // process the stack in chunks, yielding between idle slices so a big dom doesn't block the host page
    const walkChunk = (deadline: IdleDeadline) => {
        const start = performance.now();
        while (stack.length && deadline.timeRemaining() > 0 && performance.now() - start < CHUNK_TIME_BUDGET_MS) {
            const node = stack.pop();
            if (!node) continue;
            const { element, depth } = node;

            if (isRejected(element)) continue;
            candidates.push({ element, depth });

            const children = element.children;
            for (let i = children.length - 1; i >= 0; i--) {
                stack.push({ element: children[i] as HTMLElement, depth: depth + 1 });
            }
        }
    }

    // drive the chunked walk on idle callbacks, resolving once the stack drains
    await new Promise<Array<{ element: HTMLElement, depth: number }>>((resolve) => {
        const drain = (deadline: IdleDeadline) => {
            walkChunk(deadline);
            if (stack.length) {
                requestIdle(drain);
            } else {
                resolve(candidates);
            }
        }

        requestIdle(drain);
    });

    // get the geometry data for each candidate
    const geometryData = Array<GeometryDataItem>();
    for (const { element, depth } of candidates) {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        const viewport: Rect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        const document_: Rect = {
            x: rect.x + window.scrollX,
            y: rect.y + window.scrollY,
            width: rect.width,
            height: rect.height,
        }

        const style = getComputedStyle(element);
        geometryData.push({
            element, 
            depth, 
            position: style.position, 
            viewport, 
            document: document_,
        });
    }

    // give each candidate canopy, trellis, and post scores
    const scored = geometryData.map(scoreElement);

    // classify scored elements into density-limited anchors
    const classified = classifyCandidates(scored);

    // retain classified anchors by element for the renderer / future retuning
    writeAnchorMap(classified);

    return { anchors: classified };
}