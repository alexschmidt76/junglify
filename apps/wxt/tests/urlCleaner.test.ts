import { describe, it, expect } from 'vitest';
import urlCleaner from '@/utils/urlCleaner';

describe('urlCleaner', () => {
  describe('the documented examples', () => {
    it('strips YouTube tracking params and the www. prefix', () => {
      expect(
        urlCleaner('https://www.youtube.com/watch?v=abc&t=120s&si=xyz&feature=share'),
      ).toBe('https://youtube.com/watch?v=abc');
    });

    it('lower-cases the host, drops the trailing slash, the fragment and utm params', () => {
      expect(urlCleaner('https://Example.com/Profile/?utm_source=news&id=7#bio')).toBe(
        'https://example.com/Profile?id=7',
      );
    });
  });

  describe('host normalisation', () => {
    it('upgrades http to https', () => {
      expect(urlCleaner('http://example.com/foo')).toBe('https://example.com/foo');
    });

    it('lower-cases the hostname but preserves path casing', () => {
      expect(urlCleaner('https://EXAMPLE.com/MixedCase')).toBe('https://example.com/MixedCase');
    });

    it('drops a leading www. only', () => {
      expect(urlCleaner('https://www.example.com/x')).toBe('https://example.com/x');
      expect(urlCleaner('https://docs.example.com/x')).toBe('https://docs.example.com/x');
    });

    it('keeps an explicit port', () => {
      expect(urlCleaner('http://localhost:3000/foo')).toBe('https://localhost:3000/foo');
    });
  });

  describe('path handling', () => {
    it('removes a trailing slash from non-root paths', () => {
      expect(urlCleaner('https://example.com/foo/')).toBe('https://example.com/foo');
    });

    it('keeps the root path intact', () => {
      expect(urlCleaner('https://example.com/')).toBe('https://example.com/');
      expect(urlCleaner('https://example.com')).toBe('https://example.com/');
    });

    it('drops the fragment', () => {
      expect(urlCleaner('https://example.com/foo#section')).toBe('https://example.com/foo');
    });
  });

  describe('query param filtering', () => {
    it('keeps content-bearing params', () => {
      expect(urlCleaner('https://example.com/search?q=monkeys&page=2')).toBe(
        'https://example.com/search?page=2&q=monkeys',
      );
    });

    it('sorts params for a stable key regardless of input order', () => {
      expect(urlCleaner('https://example.com/x?b=2&a=1')).toBe('https://example.com/x?a=1&b=2');
    });

    it('drops params with empty values', () => {
      expect(urlCleaner('https://example.com/x?q=&id=7')).toBe('https://example.com/x?id=7');
    });

    it('strips global click/tracking params', () => {
      expect(urlCleaner('https://example.com/x?gclid=1&fbclid=2&ref=news&id=7')).toBe(
        'https://example.com/x?id=7',
      );
    });

    it('strips whole tracking-param families by prefix, case-insensitively', () => {
      expect(urlCleaner('https://example.com/x?UTM_SOURCE=a&pk_campaign=b&keep=1')).toBe(
        'https://example.com/x?keep=1',
      );
    });

    it('does not strip ambiguous pagination params like start', () => {
      expect(urlCleaner('https://example.com/list?start=20')).toBe('https://example.com/list?start=20');
    });
  });

  describe('host-specific junk params', () => {
    it('strips youtube t/si/feature but keeps them on other hosts', () => {
      expect(urlCleaner('https://youtube.com/watch?v=x&t=30&si=abc')).toBe(
        'https://youtube.com/watch?v=x',
      );
      // `t` is meaningful content on a host without a rule
      expect(urlCleaner('https://example.com/watch?t=30')).toBe('https://example.com/watch?t=30');
    });

    it('applies host rules to subdomains', () => {
      expect(urlCleaner('https://music.youtube.com/watch?v=x&t=30')).toBe(
        'https://music.youtube.com/watch?v=x',
      );
    });

    it('strips amazon and spotify host junk', () => {
      expect(urlCleaner('https://amazon.com/dp/B001?psc=1&keep=2')).toBe(
        'https://amazon.com/dp/B001?keep=2',
      );
      expect(urlCleaner('https://open.spotify.com/track/123?si=abc')).toBe(
        'https://open.spotify.com/track/123',
      );
    });
  });

  describe('stability and robustness', () => {
    it('cleans two equivalent URLs to the same key', () => {
      const a = urlCleaner('http://www.example.com/Foo/?utm_source=x&id=1#top');
      const b = urlCleaner('https://example.com/Foo?id=1');
      expect(a).toBe(b);
    });

    it('keeps URLs that show different content distinct', () => {
      expect(urlCleaner('https://example.com/a')).not.toBe(urlCleaner('https://example.com/b'));
    });

    it('returns the trimmed input when it cannot be parsed as a URL', () => {
      expect(urlCleaner('  not a url  ')).toBe('not a url');
      expect(urlCleaner('example.com/foo')).toBe('example.com/foo');
    });
  });
});
