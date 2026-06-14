import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers.js';

vi.mock('@/lib/utils/cors.js', () => ({
  applyCors: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/services/stash.services.js', () => ({
  getStashInfo: vi.fn(),
}));

vi.mock('@/lib/auth/auth.js', () => ({
  default: { api: { getSession: vi.fn() } },
}));

import { applyCors } from '@/lib/utils/cors.js';
import { getStashInfo } from '@/lib/services/stash.services.js';
import auth from '@/lib/auth/auth.js';
import handler from '@/api/stashes/my-stash.js';

const mockSession = {
  user: { id: 'user-123' },
};

const mockStash = {
  url: 'https://example.com',
  banana_count: 42,
};

describe('GET /stashes/my-stash', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applyCors).mockReturnValue(false);
  });

  it('returns the stash for an authenticated user', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(getStashInfo).mockResolvedValue(mockStash);
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.body).toEqual(mockStash);
  });

  it('looks up the stash with the session user id', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(getStashInfo).mockResolvedValue(mockStash);
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    await handler(req, res as any);
    expect(getStashInfo).toHaveBeenCalledWith('user-123');
  });

  it('returns 404 when the user has no stash', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(getStashInfo).mockResolvedValue(undefined);
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'No stash found' });
  });

  it('returns 401 when there is no session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
    expect(getStashInfo).not.toHaveBeenCalled();
  });

  it('returns 405 for non-GET methods', async () => {
    const req = makeReq({ method: 'POST' });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: 'Method not allowed' });
    expect(auth.api.getSession).not.toHaveBeenCalled();
  });

  it('short-circuits and does nothing else when applyCors handles the request', async () => {
    vi.mocked(applyCors).mockReturnValue(true);
    const req = makeReq({ method: 'OPTIONS' });
    const res = makeRes();
    await handler(req, res as any);
    expect(auth.api.getSession).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
