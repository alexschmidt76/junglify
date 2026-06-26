import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers.js';

vi.mock('@/lib/utils/cors.js', () => ({
  applyCors: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/services/stash.services.js', () => ({
  addBananaDelta: vi.fn(),
}));

vi.mock('@/lib/auth/auth.js', () => ({
  default: { api: { getSession: vi.fn() } },
}));

import { applyCors } from '@/lib/utils/cors.js';
import { addBananaDelta } from '@/lib/services/stash.services.js';
import auth from '@/lib/auth/auth.js';
import handler from '@/api/stashes/update/banana-count/index.js';

const mockSession = { user: { id: 'user-123' } };

describe('PATCH /stashes/update/banana-count', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applyCors).mockReturnValue(false);
  });

  it('returns the updated banana count with 200', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);
    vi.mocked(addBananaDelta).mockResolvedValue(45);
    const req = makeReq({ method: 'PATCH', body: { delta: 3 } });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ banana_count: 45 });
  });

  it('passes the delta and session user id to the service', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);
    vi.mocked(addBananaDelta).mockResolvedValue(10);
    const req = makeReq({ method: 'PATCH', body: { delta: 5 } });
    const res = makeRes();
    await handler(req, res as never);
    expect(addBananaDelta).toHaveBeenCalledWith(5, 'user-123');
  });

  it('returns 404 when the service reports no stash', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);
    vi.mocked(addBananaDelta).mockResolvedValue(-1);
    const req = makeReq({ method: 'PATCH', body: { delta: 3 } });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Stash not found' });
  });

  it('returns 400 when delta is missing from the body', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);
    const req = makeReq({ method: 'PATCH', body: {} });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Bad request' });
    expect(addBananaDelta).not.toHaveBeenCalled();
  });

  it('returns 401 when there is no session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const req = makeReq({ method: 'PATCH', body: { delta: 3 } });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
    expect(addBananaDelta).not.toHaveBeenCalled();
  });

  it('returns 500 when the service throws', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);
    vi.mocked(addBananaDelta).mockRejectedValue(new Error('DB error'));
    const req = makeReq({ method: 'PATCH', body: { delta: 3 } });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });

  it('returns 405 for non-PATCH methods', async () => {
    const req = makeReq({ method: 'GET', body: { delta: 3 } });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: 'Method not allowed' });
    expect(auth.api.getSession).not.toHaveBeenCalled();
  });

  it('short-circuits and does nothing else when applyCors handles the request', async () => {
    vi.mocked(applyCors).mockReturnValue(true);
    const req = makeReq({ method: 'OPTIONS' });
    const res = makeRes();
    await handler(req, res as never);
    expect(auth.api.getSession).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
