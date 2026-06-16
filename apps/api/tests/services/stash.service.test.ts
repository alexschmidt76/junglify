import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/sql.js', () => ({
  default: vi.fn(),
}));

import sql from '@/lib/db/sql.js';
import { createStash, getStashInfo } from '@/lib/services/stash.services.js';

const mockUserId = 'userId-123';
const mockUrl = 'http://url-123.com';
const mockStash = {
  url: mockUrl,
  banana_count: 42,
};

describe('stash service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createStash', () => {
    it("returns true when a new stash is successfully created", async () => {
      vi.mocked(sql).mockResolvedValue({ count: 1 });
      const result = await createStash(mockUrl, mockUserId);
      expect(result).toEqual(true);
    });

    it('returns false when the new stash is not created', async () => {
      vi.mocked(sql).mockResolvedValue({ count: 0 });
      const result = await createStash(mockUrl, mockUserId);
      expect(result).toEqual(false);
    });

    it('passes the url to the query', async () => {
      vi.mocked(sql).mockResolvedValue({ count: 1 });
      await createStash(mockUrl, mockUserId);
      expect(vi.mocked(sql).mock.calls[0]).toContain(mockUrl);
    });

    it('passes the user id to the query', async () => {
      vi.mocked(sql).mockResolvedValue({ count: 1 });
      await createStash(mockUrl, mockUserId);
      expect(vi.mocked(sql).mock.calls[0]).toContain(mockUserId);
    });
  })

  describe('getStashInfo', () => {
    it('returns the stash row when one is found', async () => {
      vi.mocked(sql).mockResolvedValue([mockStash]);
      const result = await getStashInfo(mockUserId);
      expect(result).toEqual(mockStash);
    });

    it('returns undefined when the user has no stash', async () => {
      vi.mocked(sql).mockResolvedValue([]);
      const result = await getStashInfo('user-without-stash');
      expect(result).toBeUndefined();
    });

    it('passes the user id to the query', async () => {
      vi.mocked(sql).mockResolvedValue([mockStash]);
      await getStashInfo(mockUserId);
      expect(vi.mocked(sql).mock.calls[0]).toContain(mockUserId);
    });
  });
});
