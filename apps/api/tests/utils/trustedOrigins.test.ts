import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import getTrustedOrigins from '@/lib/utils/trustedOrigins.js';

describe('getTrustedOrigins', () => {
  const VARS = ['CHROME_EXTENSION_URL', 'FIREFOX_EXTENSION_URL', 'JUNGLIFY_WEBSITE_URL', 'NODE_ENV'];
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const v of VARS) {
      saved[v] = process.env[v];
      delete process.env[v];
    }
  });

  afterEach(() => {
    for (const v of VARS) {
      if (saved[v] !== undefined) {
        process.env[v] = saved[v];
      } else {
        delete process.env[v];
      }
    }
  });

  it('returns an empty array when no origins are configured', () => {
    expect(getTrustedOrigins()).toEqual([]);
  });

  it('includes CHROME_EXTENSION_URL when set', () => {
    process.env.CHROME_EXTENSION_URL = 'chrome-extension://abc123';
    expect(getTrustedOrigins()).toContain('chrome-extension://abc123');
  });

  it('includes FIREFOX_EXTENSION_URL when set', () => {
    process.env.FIREFOX_EXTENSION_URL = 'moz-extension://def456';
    expect(getTrustedOrigins()).toContain('moz-extension://def456');
  });

  it('includes JUNGLIFY_WEBSITE_URL when set', () => {
    process.env.JUNGLIFY_WEBSITE_URL = 'https://junglify.org';
    expect(getTrustedOrigins()).toContain('https://junglify.org');
  });

  it('includes localhost when NODE_ENV is DEVELOPMENT (exact case)', () => {
    process.env.NODE_ENV = 'DEVELOPMENT';
    expect(getTrustedOrigins()).toContain('http://localhost:4321');
  });

  it('includes localhost when NODE_ENV is development (lowercase)', () => {
    process.env.NODE_ENV = 'development';
    expect(getTrustedOrigins()).toContain('http://localhost:4321');
  });

  it('does not include localhost in production', () => {
    process.env.NODE_ENV = 'production';
    expect(getTrustedOrigins()).not.toContain('http://localhost:4321');
  });

  it('includes all configured env var origins', () => {
    process.env.CHROME_EXTENSION_URL = 'chrome-extension://abc';
    process.env.JUNGLIFY_WEBSITE_URL = 'https://junglify.org';
    const origins = getTrustedOrigins();
    expect(origins).toHaveLength(2);
    expect(origins).toContain('chrome-extension://abc');
    expect(origins).toContain('https://junglify.org');
  });
});
