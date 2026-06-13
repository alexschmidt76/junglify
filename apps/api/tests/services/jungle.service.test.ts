import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/sql.js', () => ({
  default: vi.fn(),
}));

import sql from '@/lib/db/sql.js';
import {
  createJungle,
  getJungleById,
  getJungleByUrl,
  updateJungle,
  deleteJungle,
} from '@/lib/services/jungle.service.js';

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

  describe('createJungle', () => {
    it('returns the created jungle row', async () => {
      vi.mocked(sql).mockResolvedValue([mockJungle]);
      const result = await createJungle('https://example.com', null);
      expect(result).toEqual(mockJungle);
    });

    it('returns owned jungle when planted_by_user_id is provided', async () => {
      const ownedJungle = { ...mockJungle, jungle_type: 'owned', planted_by_user_id: 'user1' };
      vi.mocked(sql).mockResolvedValue([ownedJungle]);
      const result = await createJungle('https://example.com', 'user1');
      expect(result).toEqual(ownedJungle);
    });

    it('returns undefined when the insert returns no rows', async () => {
      vi.mocked(sql).mockResolvedValue([]);
      const result = await createJungle('https://example.com', null);
      expect(result).toBeUndefined();
    });
  });

  describe('getJungleById', () => {
    it('returns the jungle when found', async () => {
      vi.mocked(sql).mockResolvedValue([mockJungle]);
      const result = await getJungleById(mockJungle.id);
      expect(result).toEqual(mockJungle);
    });

    it('returns undefined when jungle does not exist', async () => {
      vi.mocked(sql).mockResolvedValue([]);
      const result = await getJungleById('nonexistent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getJungleByUrl', () => {
    it('returns the jungle when found', async () => {
      vi.mocked(sql).mockResolvedValue([mockJungle]);
      const result = await getJungleByUrl('https://example.com');
      expect(result).toEqual(mockJungle);
    });

    it('returns undefined when URL has no jungle', async () => {
      vi.mocked(sql).mockResolvedValue([]);
      const result = await getJungleByUrl('https://notfound.com');
      expect(result).toBeUndefined();
    });
  });

  describe('updateJungle', () => {
    it('returns the updated jungle for valid fields', async () => {
      const updated = { ...mockJungle, growth_stage: 5 };
      vi.mocked(sql).mockResolvedValue([updated]);
      const result = await updateJungle('id', { growth_stage: 5 } as any);
      expect(result).toMatchObject({ growth_stage: 5 });
    });

    it('accepts all four whitelisted fields', async () => {
      vi.mocked(sql).mockResolvedValue([mockJungle]);
      const data = { jungle_type: 'owned' as const, growth_stage: 3, last_visited_at: new Date(), owner: 'user1' };
      await expect(updateJungle('id', data as any)).resolves.toBeDefined();
    });

    it('returns undefined when jungle not found', async () => {
      vi.mocked(sql).mockResolvedValue([]);
      const result = await updateJungle('id', { growth_stage: 1 } as any);
      expect(result).toBeUndefined();
    });

    it('throws for the non-whitelisted field "url"', async () => {
      await expect(updateJungle('id', { url: 'https://hack.com' } as any))
        .rejects.toThrow('Invalid field in update data: url');
    });

    it('throws for the non-whitelisted field "id"', async () => {
      await expect(updateJungle('id', { id: 'hacked' } as any))
        .rejects.toThrow('Invalid field in update data: id');
    });

    it('throws for the non-whitelisted field "planted_by_user_id"', async () => {
      await expect(updateJungle('id', { planted_by_user_id: 'hacker' } as any))
        .rejects.toThrow('Invalid field in update data: planted_by_user_id');
    });

    it('does not reach the database when validation fails', async () => {
      await updateJungle('id', { url: 'https://hack.com' } as any).catch(() => {});
      expect(vi.mocked(sql)).not.toHaveBeenCalled();
    });
  });

  describe('deleteJungle', () => {
    it('returns the deleted jungle', async () => {
      vi.mocked(sql).mockResolvedValue([mockJungle]);
      const result = await deleteJungle(mockJungle.id);
      expect(result).toEqual(mockJungle);
    });

    it('returns undefined when jungle does not exist', async () => {
      vi.mocked(sql).mockResolvedValue([]);
      const result = await deleteJungle('nonexistent-id');
      expect(result).toBeUndefined();
    });
  });
});
