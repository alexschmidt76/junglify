import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers.js';

vi.mock('@/lib/utils/cors.js', () => ({
  applyCors: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/services/jungle.services.js', () => ({
  getJungleByUrl: vi.fn(),
}));

import { getJungleByUrl } from '@/lib/services/jungle.services.js';
import handler from '@/api/jungles/index.js';

const mockJungle = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  url: 'https://example.com',
  jungle_type: 'wild',
};

describe('GET /jungles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns info message when no url query param provided', async () => {
    const req = makeReq({ method: 'GET', query: {} });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(200);
    expect((res.body as any).message).toContain('junglify api');
  });

  it('returns jungle when url query param matches', async () => {
    vi.mocked(getJungleByUrl).mockResolvedValue(mockJungle);
    const req = makeReq({ method: 'GET', query: { url: 'https://example.com' } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.body).toEqual(mockJungle);
  });

  it('returns 404 when url query param matches nothing', async () => {
    vi.mocked(getJungleByUrl).mockResolvedValue(undefined);
    const req = makeReq({ method: 'GET', query: { url: 'https://notfound.com' } });
    const res = makeRes();
    await handler(req, res as any);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Jungle not found' });
  });
});
