import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers.js';

vi.mock('@/lib/utils/cors.js', () => ({
  applyCors: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/services/jungle.services.js', () => ({
  createJungle: vi.fn(),
}));

import { createJungle } from '@/lib/services/jungle.services.js';
import handler from '@/api/jungles/create/user.js';

const mockJungle = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  url: 'https://example.com',
  jungle_type: 'wild',
  userId: null,
};

describe('POST /jungles/create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates and returns the jungle with status 201', async () => {
    vi.mocked(createJungle).mockResolvedValue(mockJungle);
    const req = makeReq({ method: 'POST', body: { url: 'https://example.com' } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(mockJungle);
  });

  it('passes userId to the service when provided', async () => {
    vi.mocked(createJungle).mockResolvedValue({ ...mockJungle, jungle_type: 'owned', userId: 'user1' });
    const req = makeReq({ method: 'POST', body: { url: 'https://example.com', userId: 'user1' } });
    const res = makeRes();
    await handler(req, res as any);
    expect(createJungle).toHaveBeenCalledWith('https://example.com', 'user1');
  });

  it('passes null when userId is omitted', async () => {
    vi.mocked(createJungle).mockResolvedValue(mockJungle);
    const req = makeReq({ method: 'POST', body: { url: 'https://example.com' } });
    const res = makeRes();
    await handler(req, res as any);
    expect(createJungle).toHaveBeenCalledWith('https://example.com', null);
  });

  it('returns 400 when url is missing from the body', async () => {
    const req = makeReq({ method: 'POST', body: {} });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'URL is required to create a jungle' });
  });

  it('returns 405 for non-POST methods', async () => {
    const req = makeReq({ method: 'GET', body: { url: 'https://example.com' } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: 'Method Not Allowed' });
  });

  it('returns 500 when service throws', async () => {
    vi.mocked(createJungle).mockRejectedValue(new Error('DB error'));
    const req = makeReq({ method: 'POST', body: { url: 'https://example.com' } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal Server Error' });
  });
});
