import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

vi.mock('@/lib/db/sql.js', () => {
  const sql = vi.fn() as Mock & { begin: Mock };
  sql.begin = vi.fn();
  return { default: sql };
});

import sql from '@/lib/db/sql.js';
import { updateUser, getPopupInfo } from '@/lib/services/user.services.js';

const begin = (sql as unknown as { begin: Mock }).begin;
// the postgres.js `sql` tag is heavily typed; treat the mock loosely in tests
const mockSql = sql as unknown as Mock;

/**
 * Build a fake transactional `sql` tagged-template that resolves the queued
 * results in order. Used to drive the callback passed to `sql.begin`.
 */
function makeTxSql(results: unknown[]): Mock {
  const txSql = vi.fn() as Mock;
  results.forEach((r) => txSql.mockResolvedValueOnce(r));
  return txSql;
}

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
      mockSql.mockResolvedValue({ count: 1 } as never);
      const result = await updateUser({ id: 'user-123', name: 'Banana' });
      expect(result).toBe(true);
    });

    it('returns false when no row matched the id', async () => {
      mockSql.mockResolvedValue({ count: 0 } as never);
      const result = await updateUser({ id: 'missing', name: 'Banana' });
      expect(result).toBe(false);
    });

    it('throws when id is missing', async () => {
      await expect(updateUser({ name: 'Banana' })).rejects.toThrow('id is required');
    });

    it('does not reach the database when id is missing', async () => {
      await updateUser({ name: 'Banana' }).catch(() => {});
      expect(mockSql).not.toHaveBeenCalled();
    });

    it('passes the id into the query', async () => {
      mockSql.mockResolvedValue({ count: 1 } as never);
      await updateUser({ id: 'user-123', name: 'Banana' });
      // postgres.js tagged template: the id is an interpolated value
      const templateCall = mockSql.mock.calls.find((call) => Array.isArray(call[0]));
      expect(templateCall).toContain('user-123');
    });

    it('adds updatedAt and the update fields to the SET helper', async () => {
      mockSql.mockResolvedValue({ count: 1 } as never);
      await updateUser({ id: 'user-123', name: 'Banana', seed_count: 5 });
      // The first call is the sql(updates) helper that builds the SET clause
      const updates = mockSql.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(updates).toMatchObject({ name: 'Banana', seed_count: 5 });
      expect(typeof updates.updatedAt).toBe('number');
    });

    it('does not include id in the SET helper fields', async () => {
      mockSql.mockResolvedValue({ count: 1 } as never);
      await updateUser({ id: 'user-123', name: 'Banana' });
      const updates = mockSql.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(updates).not.toHaveProperty('id');
    });
  });

  describe('getPopupInfo', () => {
    it('returns the stash and all owned jungle urls when both exist', async () => {
      begin.mockImplementation(async (cb: (s: Mock) => unknown) =>
        cb(makeTxSql([[mockStash], mockJungles])),
      );
      const result = await getPopupInfo('user-123');
      expect(result).toEqual({
        stash: mockStash,
        jungleUrls: ['https://my-jungle.com', 'https://other-jungle.com'],
      });
    });

    it('returns undefined stash when the user has no stash', async () => {
      begin.mockImplementation(async (cb: (s: Mock) => unknown) =>
        cb(makeTxSql([[], mockJungles])),
      );
      const result = await getPopupInfo('user-123');
      expect(result).toEqual({
        stash: undefined,
        jungleUrls: ['https://my-jungle.com', 'https://other-jungle.com'],
      });
    });

    it('returns an empty jungleUrls array when the user owns no jungle', async () => {
      begin.mockImplementation(async (cb: (s: Mock) => unknown) =>
        cb(makeTxSql([[mockStash], []])),
      );
      const result = await getPopupInfo('user-123');
      expect(result).toEqual({ stash: mockStash, jungleUrls: [] });
    });

    it('passes the user id to both queries inside the transaction', async () => {
      const txSql = makeTxSql([[mockStash], mockJungles]);
      begin.mockImplementation(async (cb: (s: Mock) => unknown) => cb(txSql));
      await getPopupInfo('user-123');
      // postgres.js tagged template: 'user-123' is the interpolated value
      expect(txSql.mock.calls[0]).toContain('user-123');
      expect(txSql.mock.calls[1]).toContain('user-123');
    });

    it('returns { error: true } when the transaction throws', async () => {
      begin.mockRejectedValue(new Error('DB exploded'));
      const result = await getPopupInfo('user-123');
      expect(result).toEqual({ error: true });
    });
  });
});
