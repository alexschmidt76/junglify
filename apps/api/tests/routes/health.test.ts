import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers.js';

vi.mock('@/lib/utils/cors.js', () => ({
  applyCors: vi.fn().mockReturnValue(false),
}));

import { applyCors } from '@/lib/utils/cors.js';
import handler from '@/api/health.js';

describe('GET /health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { status: "ok" } for GET', async () => {
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    handler(req, res as any);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns 405 for non-GET methods', async () => {
    const req = makeReq({ method: 'POST' });
    const res = makeRes();
    handler(req, res as any);
    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: 'Method Not Allowed' });
  });

  it('returns early when cors short-circuits (OPTIONS)', async () => {
    vi.mocked(applyCors).mockReturnValueOnce(true);
    const req = makeReq({ method: 'OPTIONS' });
    const res = makeRes();
    handler(req, res as any);
    expect(res.json).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
