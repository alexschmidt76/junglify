import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers.js';

vi.mock('@/lib/utils/cors.js', () => ({
  applyCors: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/services/jungle.services.js', () => ({
  getJungleById: vi.fn(),
}));

import { getJungleById } from '@/lib/services/jungle.services.js';
import handler from '@/api/jungles/[id].js';

const mockJungle = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  url: 'https://example.com',
  jungle_type: 'wild',
};

describe('GET /jungles/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the jungle when found', async () => {
    vi.mocked(getJungleById).mockResolvedValue(mockJungle);
    const req = makeReq({ method: 'GET', query: { id: mockJungle.id } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.body).toEqual(mockJungle);
  });

  it('returns 404 when jungle not found', async () => {
    vi.mocked(getJungleById).mockResolvedValue(undefined);
    const req = makeReq({ method: 'GET', query: { id: 'nonexistent' } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Jungle not found' });
  });

  it('returns 405 for non-GET methods', async () => {
    const req = makeReq({ method: 'DELETE', query: { id: mockJungle.id } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: 'Method Not Allowed' });
  });

  it('returns 500 when service throws', async () => {
    vi.mocked(getJungleById).mockRejectedValue(new Error('DB connection failed'));
    const req = makeReq({ method: 'GET', query: { id: 'some-id' } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal Server Error' });
  });
});
