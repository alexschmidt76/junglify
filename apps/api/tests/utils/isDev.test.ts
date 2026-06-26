import { describe, it, expect, afterEach } from 'vitest';
import isDev from '@/lib/utils/isDev.js';

describe('isDev', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('returns true when NODE_ENV is exactly DEVELOPMENT', () => {
    process.env.NODE_ENV = 'DEVELOPMENT';
    expect(isDev()).toBe(true);
  });

  it('is case-insensitive about the DEVELOPMENT value', () => {
    process.env.NODE_ENV = 'development';
    expect(isDev()).toBe(true);
  });

  it('returns false for production', () => {
    process.env.NODE_ENV = 'production';
    expect(isDev()).toBe(false);
  });

  it('returns false when NODE_ENV is unset', () => {
    delete process.env.NODE_ENV;
    expect(isDev()).toBe(false);
  });

  it('reflects runtime changes rather than caching at import', () => {
    process.env.NODE_ENV = 'production';
    expect(isDev()).toBe(false);
    process.env.NODE_ENV = 'DEVELOPMENT';
    expect(isDev()).toBe(true);
  });
});
