import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers.js';

vi.mock('@/lib/utils/cors.js', () => ({
  applyCors: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/services/stash.services.js', () => ({
  createStash: vi.fn(),
}));

vi.mock('@/lib/auth/auth.js', () => ({
  default: { api: { getSession: vi.fn() } },
}));

import { applyCors } from '@/lib/utils/cors.js';
import { createStash } from '@/lib/services/stash.services.js';
import auth from '@/lib/auth/auth.js';
import handler from '@/api/stashes/create/index.js';

const mockUrl = 'https://example.com';
const mockSession = {
  user: { id: 'user-123' },
};

describe('POST /stashes/create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applyCors).mockReturnValue(false);
  });

  it('returns 201 when the stash is created', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(createStash).mockResolvedValue(true);
    const req = makeReq({ method: 'POST', body: { url: mockUrl } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(201);
  });

  it('passes the url and session user id to createStash', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(createStash).mockResolvedValue(true);
    const req = makeReq({ method: 'POST', body: { url: mockUrl } });
    const res = makeRes();
    await handler(req, res as any);
    expect(createStash).toHaveBeenCalledWith(mockUrl, 'user-123');
  });

  it('returns 500 when the stash could not be created', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(createStash).mockResolvedValue(false);
    const req = makeReq({ method: 'POST', body: { url: mockUrl } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: 'An internal server error has occured. Make sure this url is a jungle you own.',
    });
  });

  it('returns 500 when the service throws', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(createStash).mockRejectedValue(new Error('DB error'));
    const req = makeReq({ method: 'POST', body: { url: mockUrl } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal Server Error' });
  });

  it('returns 400 when url is missing from the body', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    const req = makeReq({ method: 'POST', body: {} });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'A URL is required to hide a stash' });
    expect(createStash).not.toHaveBeenCalled();
  });

  it('returns 401 when there is no session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const req = makeReq({ method: 'POST', body: { url: mockUrl } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
    expect(createStash).not.toHaveBeenCalled();
  });

  it('returns 405 for non-POST methods', async () => {
    const req = makeReq({ method: 'GET', body: { url: mockUrl } });
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
