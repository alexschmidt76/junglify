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

describe('GET /jungles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the info message when no url query param is provided', async () => {
    const req = makeReq({ method: 'GET', query: {} });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(200);
    expect((res.body as { message: string }).message).toContain('junglify api');
  });

  it('returns the growth stage and stash flag when the url matches', async () => {
    vi.mocked(getJungleByUrl).mockResolvedValue({ growth_stage: 3, has_stash: true });
    const req = makeReq({ method: 'GET', query: { url: 'https://example.com' } });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ growthStage: 3, hasStash: true });
  });

  it('looks up the jungle with the url query param', async () => {
    vi.mocked(getJungleByUrl).mockResolvedValue({ growth_stage: 0, has_stash: false });
    const req = makeReq({ method: 'GET', query: { url: 'https://example.com' } });
    const res = makeRes();
    await handler(req, res as never);
    expect(getJungleByUrl).toHaveBeenCalledWith('https://example.com');
  });

  it('returns 404 when the url query param matches nothing', async () => {
    vi.mocked(getJungleByUrl).mockResolvedValue(undefined);
    const req = makeReq({ method: 'GET', query: { url: 'https://notfound.com' } });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Jungle not found' });
  });

  it('returns 405 for non-GET methods', async () => {
    const req = makeReq({ method: 'POST', query: {} });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: 'Method Not Allowed' });
  });
});
