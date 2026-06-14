import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/sql.js', () => ({
  default: vi.fn(),
}));

import sql from '@/lib/db/sql.js';
import { getStashInfo } from '@/lib/services/stash.services.js';

const mockStash = {
  url: 'https://example.com',
  banana_count: 42,
};

describe('stash service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStashInfo', () => {
    it('returns the stash row when one is found', async () => {
      vi.mocked(sql).mockResolvedValue([mockStash]);
      const result = await getStashInfo('user-123');
      expect(result).toEqual(mockStash);
    });

    it('returns undefined when the user has no stash', async () => {
      vi.mocked(sql).mockResolvedValue([]);
      const result = await getStashInfo('user-without-stash');
      expect(result).toBeUndefined();
    });

    it('passes the user id to the query', async () => {
      vi.mocked(sql).mockResolvedValue([mockStash]);
      await getStashInfo('user-123');
      // postgres.js tagged template: ['user-123'] is the interpolated value
      expect(vi.mocked(sql).mock.calls[0]).toContain('user-123');
    });
  });
});
