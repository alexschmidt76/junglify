import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

vi.mock('@/lib/db/sql.js', () => ({
  default: vi.fn(),
}));

import sql from '@/lib/db/sql.js';
import { createStash, getStashInfo, addBananaDelta } from '@/lib/services/stash.services.js';

// the postgres.js `sql` tag is heavily typed; treat the mock loosely in tests
const mockSql = sql as unknown as Mock;

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
      mockSql.mockResolvedValue({ count: 1 });
      const result = await createStash(mockUrl, mockUserId);
      expect(result).toEqual(true);
    });

    it('returns false when the new stash is not created', async () => {
      mockSql.mockResolvedValue({ count: 0 });
      const result = await createStash(mockUrl, mockUserId);
      expect(result).toEqual(false);
    });

    it('passes the url to the query', async () => {
      mockSql.mockResolvedValue({ count: 1 });
      await createStash(mockUrl, mockUserId);
      expect(mockSql.mock.calls[0]).toContain(mockUrl);
    });

    it('passes the user id to the query', async () => {
      mockSql.mockResolvedValue({ count: 1 });
      await createStash(mockUrl, mockUserId);
      expect(mockSql.mock.calls[0]).toContain(mockUserId);
    });
  })

  describe('getStashInfo', () => {
    it('returns the stash row when one is found', async () => {
      mockSql.mockResolvedValue([mockStash]);
      const result = await getStashInfo(mockUserId);
      expect(result).toEqual(mockStash);
    });

    it('returns undefined when the user has no stash', async () => {
      mockSql.mockResolvedValue([]);
      const result = await getStashInfo('user-without-stash');
      expect(result).toBeUndefined();
    });

    it('passes the user id to the query', async () => {
      mockSql.mockResolvedValue([mockStash]);
      await getStashInfo(mockUserId);
      expect(mockSql.mock.calls[0]).toContain(mockUserId);
    });
  });

  describe('addBananaDelta', () => {
    it('returns the new banana count when the stash exists', async () => {
      mockSql.mockResolvedValue([{ banana_count: 45 }]);
      const result = await addBananaDelta(3, mockUserId);
      expect(result).toBe(45);
    });

    it('returns -1 when no stash row was updated', async () => {
      mockSql.mockResolvedValue([]);
      const result = await addBananaDelta(3, 'user-without-stash');
      expect(result).toBe(-1);
    });

    it('passes the delta and user id to the query', async () => {
      mockSql.mockResolvedValue([{ banana_count: 0 }]);
      await addBananaDelta(-7, mockUserId);
      expect(mockSql.mock.calls[0]).toContain(-7);
      expect(mockSql.mock.calls[0]).toContain(mockUserId);
    });
  });
});
