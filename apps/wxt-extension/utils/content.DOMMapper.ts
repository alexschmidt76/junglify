type Rect = { x: number, y: number, width: number, height: number };
type TagWeight = { canopy: number, trellis: number, post: number };

interface GeometryDataItem {
    element: HTMLElement;
    depth: number;
    position: string;
    viewport: Rect;
    document: Rect;
};

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


const TAG_DENYLIST = new Set(['SCRIPT', 'STYLE', 'META', 'LINK', 'NOSCRIPT', 'TEMPLATE']);

const DEFAULT_TAG_WEIGHT: TagWeight = { canopy: 0.3, trellis: 0.3, post: 0.3 };
const TAG_WEIGHTS: Record<string, TagWeight> = {
    NAV: { canopy: 0.1, trellis: 0.8, post: 0.2 },
    HEADER: { canopy: 0.1, trellis: 0.1, post: 0.7 },
    FOOTER: { canopy: 0.1, trellis: 0.1, post: 0.6 },
    SECTION: { canopy: 0.6, trellis: 0.2, post: 0.1 },
    ARTICLE: { canopy: 0.7, trellis: 0.1, post: 0.1 },
    ASIDE: { canopy: 0.2, trellis: 0.5, post: 0.2 },
};

const IDEAL_DEPTH = 6; // placeholder
const DEPTH_SPREAD = 6;

const POST_POSITION_TYPES = new Set(['fixed', 'sticky']);

const CANOPY_WEIGHTS = { area: 0.5, narrowness: 0.2, depth: 0.2, tag: 0.1 };
const TRELLIS_WEIGHTS = { narrowness: 0.4, depth: 0.3, tag: 0.3 };
const POST_WEIGHTS = { position: 0.6, depth: 0.2, tag: 0.2 };

/**
 * isRejected detects if a node is rejected from the first pass of the DOM.
 * 
 * @param element
 * @returns boolean
*/
const isRejected = (element: HTMLElement) => {
    if (!(element instanceof HTMLElement)) return true;
    if (TAG_DENYLIST.has(element.tagName)) return true;
    if (element.hidden || element.getAttribute('aria-hidden') === 'true' || element.inert) return true;
    if (!element.checkVisibility()) return true;
    return false;
}

const getTagWeight = (element: HTMLElement) => {
    return TAG_WEIGHTS[element.tagName] ?? DEFAULT_TAG_WEIGHT;
}

const getDepthScore = (depth: number) => {
    const raw = 1 - Math.abs(depth - IDEAL_DEPTH) / DEPTH_SPREAD;
    return Math.max(0, Math.min(1, raw));
}

const getNormalizedArea = (viewport: Rect) => {
    const viewportArea = window.innerWidth * window.innerHeight;
    const elementArea = viewport.width * viewport.height;
    return Math.min(1, elementArea / viewportArea)
}

const getNarrowness = (viewport: Rect) => {
    const longSide = Math.max(viewport.width, viewport.height);
    const shortSide = Math.min(viewport.width, viewport.height);
    
    if (longSide === 0) return 0;
    return 1 - shortSide / longSide;
}

const getPositionTypeScore = (position: string) => {
    return POST_POSITION_TYPES.has(position) ? 1 : 0;
}

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
 * Map the DOM and find surfaces to anchor animations and textures to.
 */
export const domMapper = async () => {
    // step 1: get list of dom elements that will matter
    const candidates: [{ element: HTMLElement, depth: number }] = [{ element: document.body, depth: 0 }];
    const stack: [{ element: HTMLElement, depth: number }] = [{ element: document.body, depth: 0 }];

    while (stack.length > 0) {
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

    // step 2: batch geometry data
    type Rect = { x: number, y: number, width: number, height: number };
    interface GeometryDataItem {
        element: HTMLElement;
        depth: number;
        position: string;
        viewport: Rect;
        document: Rect;
    }

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

    // step 3: scoring the elements
    const scored = geometryData.map(scoreElement);
    
}