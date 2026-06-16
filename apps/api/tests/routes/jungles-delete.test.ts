import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers.js';

vi.mock('@/lib/utils/cors.js', () => ({
  applyCors: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/services/jungle.services.js', () => ({
  deleteJungle: vi.fn(),
}));

import { deleteJungle } from '@/lib/services/jungle.services.js';
import handler from '@/api/jungles/delete/[id].js';

const mockJungle = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  url: 'https://example.com',
  jungle_type: 'wild',
};

describe('DELETE /jungles/delete/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the deleted jungle', async () => {
    vi.mocked(deleteJungle).mockResolvedValue(mockJungle);
    const req = makeReq({ method: 'DELETE', query: { id: mockJungle.id } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.body).toEqual(mockJungle);
  });

  it('returns 404 when jungle not found', async () => {
    vi.mocked(deleteJungle).mockResolvedValue(undefined);
    const req = makeReq({ method: 'DELETE', query: { id: 'nonexistent' } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Jungle not found' });
  });

  it('returns 400 when id is missing', async () => {
    const req = makeReq({ method: 'DELETE', query: {} });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Jungle id is required for deleting' });
  });

  it('returns 405 for non-DELETE methods', async () => {
    const req = makeReq({ method: 'GET', query: { id: mockJungle.id } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: 'Method Not Allowed' });
  });

  it('returns 500 when service throws', async () => {
    vi.mocked(deleteJungle).mockRejectedValue(new Error('DB error'));
    const req = makeReq({ method: 'DELETE', query: { id: mockJungle.id } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal Server Error' });
  });
});
