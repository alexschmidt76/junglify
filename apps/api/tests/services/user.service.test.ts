import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/sql.js', () => ({
  default: vi.fn(),
}));

import sql from '@/lib/db/sql.js';
import { getPopupInfo } from '@/lib/services/user.service.js';

const mockStash = {
  url: 'https://example.com',
  banana_count: 42,
};

const mockJungles = [
  { url: 'https://my-jungle.com' },
  { url: 'https://other-jungle.com' },
];

describe('user service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPopupInfo', () => {
    it('returns the stash and all owned jungle urls when both exist', async () => {
      vi.mocked(sql)
        .mockResolvedValueOnce([mockStash])
        .mockResolvedValueOnce(mockJungles);
      const result = await getPopupInfo('user-123');
      expect(result).toEqual({
        stash: mockStash,
        jungleUrls: ['https://my-jungle.com', 'https://other-jungle.com'],
      });
    });

    it('returns undefined stash when the user has no stash', async () => {
      vi.mocked(sql)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockJungles);
      const result = await getPopupInfo('user-123');
      expect(result).toEqual({
        stash: undefined,
        jungleUrls: ['https://my-jungle.com', 'https://other-jungle.com'],
      });
    });

    it('returns an empty jungleUrls array when the user owns no jungle', async () => {
      vi.mocked(sql)
        .mockResolvedValueOnce([mockStash])
        .mockResolvedValueOnce([]);
      const result = await getPopupInfo('user-123');
      expect(result).toEqual({ stash: mockStash, jungleUrls: [] });
    });

    it('passes the user id to both queries', async () => {
      vi.mocked(sql)
        .mockResolvedValueOnce([mockStash])
        .mockResolvedValueOnce(mockJungles);
      await getPopupInfo('user-123');
      // postgres.js tagged template: 'user-123' is the interpolated value
      expect(vi.mocked(sql).mock.calls[0]).toContain('user-123');
      expect(vi.mocked(sql).mock.calls[1]).toContain('user-123');
    });
  });
});
