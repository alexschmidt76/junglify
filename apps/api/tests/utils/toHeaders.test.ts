import { describe, it, expect } from 'vitest';
import type { VercelRequest } from '@vercel/node';
import toHeaders from '@/lib/utils/toHeaders.js';

function makeReq(headers: VercelRequest['headers']): VercelRequest {
  return { headers } as VercelRequest;
}

describe('toHeaders', () => {
  it('returns a Headers instance', () => {
    const result = toHeaders(makeReq({}));
    expect(result).toBeInstanceOf(Headers);
  });

  it('copies string header values', () => {
    const result = toHeaders(makeReq({ authorization: 'Bearer token', 'content-type': 'application/json' }));
    expect(result.get('authorization')).toBe('Bearer token');
    expect(result.get('content-type')).toBe('application/json');
  });

  it('skips headers with undefined values', () => {
    const result = toHeaders(makeReq({ 'x-present': 'yes', 'x-missing': undefined }));
    expect(result.get('x-present')).toBe('yes');
    expect(result.has('x-missing')).toBe(false);
  });

  it('joins array header values with a comma and space', () => {
    const result = toHeaders(makeReq({ 'set-cookie': ['a=1', 'b=2'] }));
    expect(result.get('set-cookie')).toBe('a=1, b=2');
  });

  it('produces an empty Headers when there are no headers', () => {
    const result = toHeaders(makeReq({}));
    expect([...result.keys()]).toEqual([]);
  });
});
