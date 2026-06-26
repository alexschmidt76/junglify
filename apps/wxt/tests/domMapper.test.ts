import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { domMapper, anchorMap } from '@/utils/content.domMapper';

/** Give an element a deterministic box, since jsdom reports all-zero rects. */
function setRect(el: HTMLElement, width: number, height: number, x = 0, y = 0): void {
  el.getBoundingClientRect = () =>
    ({
      x,
      y,
      width,
      height,
      top: y,
      left: x,
      right: x + width,
      bottom: y + height,
      toJSON: () => ({}),
    }) as DOMRect;
}

beforeAll(() => {
  // jsdom doesn't implement Element.checkVisibility, which domMapper relies on
  (HTMLElement.prototype as unknown as { checkVisibility: () => boolean }).checkVisibility =
    function (this: HTMLElement) {
      return !this.hidden;
    };
});

beforeEach(() => {
  document.body.innerHTML = '';
  // domMapper reads getComputedStyle(el).position; back it with the inline style
  vi.stubGlobal('getComputedStyle', (el: Element) => ({
    position: (el as HTMLElement).style.position || 'static',
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('domMapper', () => {
  it('classifies anchors by shape and skips rejected elements', async () => {
    document.body.innerHTML = `
      <article id="canopy"></article>
      <nav id="trellis"></nav>
      <header id="post" style="position: fixed"></header>
      <script id="js"></script>
      <div id="hidden" hidden></div>
    `;

    const canopy = document.getElementById('canopy') as HTMLElement;
    const trellis = document.getElementById('trellis') as HTMLElement;
    const post = document.getElementById('post') as HTMLElement;

    // wide & short -> canopy; tall & narrow -> trellis; fixed banner -> post
    setRect(canopy, 800, 600);
    setRect(trellis, 100, 600);
    setRect(post, 1000, 80);

    const result = await domMapper();
    const byId = (id: string) => result.anchors.find((a) => a.element.id === id);

    expect(byId('canopy')?.category).toBe('canopy');
    expect(byId('trellis')?.category).toBe('trellis');
    expect(byId('post')?.category).toBe('post');

    // denylisted and hidden elements never become anchors
    expect(byId('js')).toBeUndefined();
    expect(byId('hidden')).toBeUndefined();

    // anchors are also written to the shared anchorMap for the renderer
    expect(anchorMap.get(canopy)?.category).toBe('canopy');
  });

  it('drops zero-size elements', async () => {
    document.body.innerHTML = `<article id="invisible"></article>`;
    // no setRect -> jsdom reports a 0x0 box, which domMapper filters out
    const result = await domMapper();
    expect(result.anchors).toHaveLength(0);
  });

  it('skips aria-hidden subtrees', async () => {
    document.body.innerHTML = `<article id="ghost" aria-hidden="true"></article>`;
    const ghost = document.getElementById('ghost') as HTMLElement;
    setRect(ghost, 800, 600);
    const result = await domMapper();
    expect(result.anchors).toHaveLength(0);
  });
});
