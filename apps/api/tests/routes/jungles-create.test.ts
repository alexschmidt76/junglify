import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers.js';

vi.mock('@/lib/utils/cors.js', () => ({
  applyCors: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/services/jungle.services.js', () => ({
  createUserJungle: vi.fn(),
}));

vi.mock('@/lib/auth/auth.js', () => ({
  default: { api: { getSession: vi.fn() } },
}));

import { applyCors } from '@/lib/utils/cors.js';
import { createUserJungle } from '@/lib/services/jungle.services.js';
import auth from '@/lib/auth/auth.js';
import handler from '@/api/jungles/create/user.js';

const mockSession = { user: { id: 'user-123' } };

describe('POST /jungles/create/user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applyCors).mockReturnValue(false);
  });

  it('creates an owned jungle and returns the new seed count with 201', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);
    vi.mocked(createUserJungle).mockResolvedValue({ newSeedCount: 4 });
    const req = makeReq({ method: 'POST', body: { url: 'https://example.com' } });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ newSeedCount: 4 });
  });

  it('passes the url and session user id to the service', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);
    vi.mocked(createUserJungle).mockResolvedValue({ newSeedCount: 4 });
    const req = makeReq({ method: 'POST', body: { url: 'https://example.com' } });
    const res = makeRes();
    await handler(req, res as never);
    expect(createUserJungle).toHaveBeenCalledWith('https://example.com', 'user-123');
  });

  it('returns 422 when the user is out of seeds', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);
    vi.mocked(createUserJungle).mockResolvedValue({ error: 422 });
    const req = makeReq({ method: 'POST', body: { url: 'https://example.com' } });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(422);
    expect(res.body).toEqual({ error: "You don't have enough seeds!" });
  });

  it('returns 500 when the service reports an internal error', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);
    vi.mocked(createUserJungle).mockResolvedValue({ error: 500 });
    const req = makeReq({ method: 'POST', body: { url: 'https://example.com' } });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });

  it('returns 400 when url is missing from the body', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);
    const req = makeReq({ method: 'POST', body: {} });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'url must be a string and must not be null' });
    expect(createUserJungle).not.toHaveBeenCalled();
  });

  it('returns 401 when there is no session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const req = makeReq({ method: 'POST', body: { url: 'https://example.com' } });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
    expect(createUserJungle).not.toHaveBeenCalled();
  });

  it('returns 405 for non-POST methods', async () => {
    const req = makeReq({ method: 'GET', body: { url: 'https://example.com' } });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: 'Method Not Allowed' });
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
