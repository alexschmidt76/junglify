import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/sql.js', () => ({
  default: vi.fn(),
}));

import sql from '@/lib/db/sql.js';
import { updateUser } from '@/lib/services/user.service.js';
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

  describe('updateUser', () => {
    it('returns true when a row was updated', async () => {
      vi.mocked(sql).mockResolvedValue({ count: 1 } as never);
      const result = await updateUser({ id: 'user-123', name: 'Banana' });
      expect(result).toBe(true);
    });

    it('returns false when no row matched the id', async () => {
      vi.mocked(sql).mockResolvedValue({ count: 0 } as never);
      const result = await updateUser({ id: 'missing', name: 'Banana' });
      expect(result).toBe(false);
    });

    it('throws when id is missing', async () => {
      await expect(updateUser({ name: 'Banana' })).rejects.toThrow('id is required');
    });

    it('does not reach the database when id is missing', async () => {
      await updateUser({ name: 'Banana' }).catch(() => {});
      expect(vi.mocked(sql)).not.toHaveBeenCalled();
    });

    it('passes the id into the query', async () => {
      vi.mocked(sql).mockResolvedValue({ count: 1 } as never);
      await updateUser({ id: 'user-123', name: 'Banana' });
      // postgres.js tagged template: the id is an interpolated value
      const templateCall = vi.mocked(sql).mock.calls.find((call) => Array.isArray(call[0]));
      expect(templateCall).toContain('user-123');
    });

    it('adds updatedAt and the update fields to the SET helper', async () => {
      vi.mocked(sql).mockResolvedValue({ count: 1 } as never);
      await updateUser({ id: 'user-123', name: 'Banana', seed_count: 5 });
      // The first call is the sql(updates) helper that builds the SET clause
      const updates = vi.mocked(sql).mock.calls[0][0] as Record<string, unknown>;
      expect(updates).toMatchObject({ name: 'Banana', seed_count: 5 });
      expect(typeof updates.updatedAt).toBe('number');
    });

    it('does not include id in the SET helper fields', async () => {
      vi.mocked(sql).mockResolvedValue({ count: 1 } as never);
      await updateUser({ id: 'user-123', name: 'Banana' });
      const updates = vi.mocked(sql).mock.calls[0][0] as Record<string, unknown>;
      expect(updates).not.toHaveProperty('id');
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
