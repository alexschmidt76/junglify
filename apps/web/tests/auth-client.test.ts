import { describe, it, expect, vi } from 'vitest';

vi.mock('@repo/auth/auth-client', () => ({
  default: vi.fn(() => ({ __mock: 'authClient' })),
}));

import getAuthClient from '@repo/auth/auth-client';
import authClient from '@/src/layouts/auth/auth-client';

describe('web auth client', () => {
  it('builds the auth client from PUBLIC_BETTER_AUTH_URL', () => {
    expect(getAuthClient).toHaveBeenCalledWith('https://auth.test');
  });

  it('exports the constructed client', () => {
    expect(authClient).toEqual({ __mock: 'authClient' });
  });
});
