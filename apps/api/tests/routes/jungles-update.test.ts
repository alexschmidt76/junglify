import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers.js';

vi.mock('@/lib/utils/cors.js', () => ({
  applyCors: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/services/jungle.services.js', () => ({
  updateJungle: vi.fn(),
}));

import { updateJungle } from '@/lib/services/jungle.services.js';
import handler from '@/api/jungles/update/[id].js';

const mockJungle = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  url: 'https://example.com',
  jungle_type: 'wild',
  growth_stage: 5,
};

describe('PUT /jungles/update/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the updated jungle', async () => {
    vi.mocked(updateJungle).mockResolvedValue(mockJungle);
    const req = makeReq({ method: 'PUT', query: { id: mockJungle.id }, body: { growth_stage: 5 } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.body).toEqual(mockJungle);
  });

  it('returns 404 when jungle not found', async () => {
    vi.mocked(updateJungle).mockResolvedValue(undefined);
    const req = makeReq({ method: 'PUT', query: { id: 'nonexistent' }, body: { growth_stage: 1 } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Jungle not found' });
  });

  it('returns 400 when id is missing', async () => {
    const req = makeReq({ method: 'PUT', query: {}, body: { growth_stage: 1 } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Jungle id is required for update' });
  });

  it('returns 400 when service throws for an invalid field', async () => {
    vi.mocked(updateJungle).mockRejectedValue(new Error('Invalid field in update data: url'));
    const req = makeReq({ method: 'PUT', query: { id: mockJungle.id }, body: { url: 'hack' } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(400);
    expect((res.body as any).error).toContain('Invalid field');
  });

  it('returns 405 for non-PUT methods', async () => {
    const req = makeReq({ method: 'GET', query: { id: mockJungle.id }, body: {} });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: 'Method Not Allowed' });
  });

  it('returns 500 for unexpected service errors', async () => {
    vi.mocked(updateJungle).mockRejectedValue(new Error('DB connection lost'));
    const req = makeReq({ method: 'PUT', query: { id: mockJungle.id }, body: { growth_stage: 1 } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(500);
  });
});
