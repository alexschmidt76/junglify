import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers.js';

vi.mock('@/lib/utils/cors.js', () => ({
  applyCors: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/services/user.services.js', () => ({
  getPopupInfo: vi.fn(),
}));

vi.mock('@/lib/auth/auth.js', () => ({
  default: { api: { getSession: vi.fn() } },
}));

import { applyCors } from '@/lib/utils/cors.js';
import { getPopupInfo } from '@/lib/services/user.services.js';
import auth from '@/lib/auth/auth.js';
import handler from '@/api/users/popup-info.js';

const mockSession = {
  user: { id: 'user-123' },
};

const mockPopupInfo = {
  stash: { url: 'https://example.com', banana_count: 42 },
  jungleUrls: ['https://my-jungle.com', 'https://other-jungle.com'],
};

describe('GET /users/popup-info', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applyCors).mockReturnValue(false);
  });

  it('returns the popup info for an authenticated user', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);
    vi.mocked(getPopupInfo).mockResolvedValue(mockPopupInfo);
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockPopupInfo);
  });

  it('looks up the popup info with the session user id', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);
    vi.mocked(getPopupInfo).mockResolvedValue(mockPopupInfo);
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    await handler(req, res as never);
    expect(getPopupInfo).toHaveBeenCalledWith('user-123');
  });

  it('returns 500 when the service reports an error', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never);
    vi.mocked(getPopupInfo).mockResolvedValue({ error: true });
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });

  it('returns 401 when there is no session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    await handler(req, res as never);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
    expect(getPopupInfo).not.toHaveBeenCalled();
  });

  it('returns 405 for non-GET methods', async () => {
    const req = makeReq({ method: 'POST' });
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
