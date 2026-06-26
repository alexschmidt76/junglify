import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

vi.mock('@/lib/db/sql.js', () => {
  const sql = vi.fn() as Mock & { begin: Mock };
  sql.begin = vi.fn();
  return { default: sql };
});

import sql from '@/lib/db/sql.js';
import {
  createUserJungle,
  getJungleById,
  getJungleByUrl,
  updateJungle,
  deleteJungle,
} from '@/lib/services/jungle.services.js';
import type JungleSchema from '@/lib/typings/jungleSchemea.js';

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

const mockJungle = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  url: 'https://example.com',
  jungle_type: 'wild',
  planted_by_user_id: null,
  planted_at: new Date('2024-01-01'),
  last_visited_at: new Date('2024-01-01'),
  growth_stage: 0,
};

describe('jungle service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUserJungle', () => {
    it('wraps the transaction result in { newSeedCount }', async () => {
      begin.mockResolvedValue(4);
      const result = await createUserJungle('https://example.com', 'user1');
      expect(result).toEqual({ newSeedCount: 4 });
    });

    it('returns { error: 500 } when the transaction throws', async () => {
      begin.mockRejectedValue(new Error('DB exploded'));
      const result = await createUserJungle('https://example.com', 'user1');
      expect(result).toEqual({ error: 500 });
    });

    it('decrements the seed count and inserts the jungle inside the transaction', async () => {
      const txSql = makeTxSql([[{ seed_count: 4 }], { count: 1 }]);
      let cbResult: unknown;
      begin.mockImplementation(async (cb: (s: Mock) => unknown) => {
        cbResult = await cb(txSql);
        return cbResult;
      });

      await createUserJungle('https://example.com', 'user1');

      expect(cbResult).toBe(4);
      // the user id drives the seed-count UPDATE
      expect(txSql.mock.calls[0]).toContain('user1');
      // the url is interpolated into the INSERT
      expect(txSql.mock.calls[1]).toContain('https://example.com');
    });

    it("returns { error: 422 } from the transaction when the user has no seeds", async () => {
      const txSql = makeTxSql([[]]); // UPDATE ... RETURNING returns no row
      let cbResult: unknown;
      begin.mockImplementation(async (cb: (s: Mock) => unknown) => {
        cbResult = await cb(txSql);
        return cbResult;
      });

      await createUserJungle('https://example.com', 'user1');

      expect(cbResult).toEqual({ error: 422 });
      // the INSERT is never reached
      expect(txSql).toHaveBeenCalledTimes(1);
    });

    it('returns { error: 500 } from the transaction when the insert affects no rows', async () => {
      const txSql = makeTxSql([[{ seed_count: 4 }], { count: 0 }]);
      let cbResult: unknown;
      begin.mockImplementation(async (cb: (s: Mock) => unknown) => {
        cbResult = await cb(txSql);
        return cbResult;
      });

      await createUserJungle('https://example.com', 'user1');

      expect(cbResult).toEqual({ error: 500 });
    });
  });

  describe('getJungleById', () => {
    it('returns the jungle when found', async () => {
      mockSql.mockResolvedValue([mockJungle]);
      const result = await getJungleById(mockJungle.id);
      expect(result).toEqual(mockJungle);
    });

    it('returns undefined when jungle does not exist', async () => {
      mockSql.mockResolvedValue([]);
      const result = await getJungleById('nonexistent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getJungleByUrl', () => {
    it('returns the jungle row when found', async () => {
      const row = { growth_stage: 3, has_stash: true };
      mockSql.mockResolvedValue([row]);
      const result = await getJungleByUrl('https://example.com');
      expect(result).toEqual(row);
    });

    it('returns undefined when URL has no jungle', async () => {
      mockSql.mockResolvedValue([]);
      const result = await getJungleByUrl('https://notfound.com');
      expect(result).toBeUndefined();
    });
  });

  describe('updateJungle', () => {
    it('returns the updated jungle for valid fields', async () => {
      const updated = { ...mockJungle, growth_stage: 5 };
      mockSql.mockResolvedValue([updated]);
      const result = await updateJungle('id', { growth_stage: 5 } as JungleSchema);
      expect(result).toMatchObject({ growth_stage: 5 });
    });

    it('accepts all four whitelisted fields', async () => {
      mockSql.mockResolvedValue([mockJungle]);
      const data = { jungle_type: 'owned', growth_stage: 3, last_visited_at: new Date(), owner: 'user1' };
      await expect(updateJungle('id', data as unknown as JungleSchema)).resolves.toBeDefined();
    });

    it('returns undefined when jungle not found', async () => {
      mockSql.mockResolvedValue([]);
      const result = await updateJungle('id', { growth_stage: 1 } as JungleSchema);
      expect(result).toBeUndefined();
    });

    it('throws for the non-whitelisted field "url"', async () => {
      await expect(updateJungle('id', { url: 'https://hack.com' }))
        .rejects.toThrow('Invalid field in update data: url');
    });

    it('throws for the non-whitelisted field "id"', async () => {
      await expect(updateJungle('id', { id: 'hacked' } as JungleSchema))
        .rejects.toThrow('Invalid field in update data: id');
    });

    it('throws for the non-whitelisted field "planted_by_user_id"', async () => {
      await expect(updateJungle('id', { planted_by_user_id: 'hacker' } as JungleSchema))
        .rejects.toThrow('Invalid field in update data: planted_by_user_id');
    });

    it('does not reach the database when validation fails', async () => {
      await updateJungle('id', { url: 'https://hack.com' }).catch(() => {});
      expect(mockSql).not.toHaveBeenCalled();
    });
  });

  describe('deleteJungle', () => {
    it('returns the deleted jungle', async () => {
      mockSql.mockResolvedValue([mockJungle]);
      const result = await deleteJungle(mockJungle.id);
      expect(result).toEqual(mockJungle);
    });

    it('returns undefined when jungle does not exist', async () => {
      mockSql.mockResolvedValue([]);
      const result = await deleteJungle('nonexistent-id');
      expect(result).toBeUndefined();
    });
  });
});
