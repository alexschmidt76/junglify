import { describe, it, expect, beforeEach } from 'vitest';
import { harvestAndCleanLinks } from '@/utils/content.linkHarvester';

describe('harvestAndCleanLinks', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns an empty array when there are no links', () => {
    expect(harvestAndCleanLinks()).toEqual([]);
  });

  it('collects and cleans navigable links', () => {
    document.body.innerHTML = `
      <a href="https://www.youtube.com/watch?v=abc&t=5&si=xx">video</a>
      <a href="/about">about</a>
    `;
    const links = harvestAndCleanLinks();
    expect(links).toContain('https://youtube.com/watch?v=abc');
    // relative hrefs resolve against the jsdom document URL (https://example.com/)
    expect(links).toContain('https://example.com/about');
  });

  it('skips non-navigational hrefs', () => {
    document.body.innerHTML = `
      <a href="#section">anchor</a>
      <a href="mailto:hi@example.com">email</a>
      <a href="tel:+15551234567">call</a>
      <a href="javascript:void(0)">js</a>
    `;
    expect(harvestAndCleanLinks()).toEqual([]);
  });

  it('deduplicates links that clean to the same key', () => {
    document.body.innerHTML = `
      <a href="https://www.youtube.com/watch?v=abc&t=5">a</a>
      <a href="https://youtube.com/watch?v=abc">b</a>
      <a href="/about">c</a>
      <a href="https://example.com/about/">d</a>
    `;
    const links = harvestAndCleanLinks();
    expect(links).toHaveLength(2);
    expect(new Set(links)).toEqual(
      new Set(['https://youtube.com/watch?v=abc', 'https://example.com/about']),
    );
  });

  it('ignores anchors without an href attribute', () => {
    document.body.innerHTML = `<a>no href</a><a href="/x">has href</a>`;
    expect(harvestAndCleanLinks()).toEqual(['https://example.com/x']);
  });
});
