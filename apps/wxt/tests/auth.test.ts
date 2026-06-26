import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetBrowserState, seedStorage, browserState } from './fakeBrowser';

vi.mock('@repo/auth/auth-client', () => ({
  default: vi.fn(() => ({ __mock: 'authClient' })),
}));

import getAuthClient from '@repo/auth/auth-client';
import authClient from '@/utils/auth';

type FetchOptions = {
  onSuccess(ctx: { response: { headers: { get(name: string): string | null } } }): Promise<void>;
  auth: { type: string; token: () => Promise<string> };
};

// auth.ts calls getAuthClient(url, fetchOptions) once at import; grab those options
const fetchOptions = vi.mocked(getAuthClient).mock.calls[0]?.[1] as unknown as FetchOptions;

describe('wxt auth client', () => {
  beforeEach(() => {
    resetBrowserState();
  });

  it('builds the client from WXT_BETTER_AUTH_URL with bearer fetch options', () => {
    expect(getAuthClient).toHaveBeenCalledWith('https://auth.test', expect.anything());
    expect(authClient).toEqual({ __mock: 'authClient' });
    expect(fetchOptions.auth.type).toBe('Bearer');
  });

  it('supplies the stored bearer token for the Authorization header', async () => {
    seedStorage('bearerToken', 'tok-123');
    await expect(fetchOptions.auth.token()).resolves.toBe('tok-123');
  });

  it('falls back to an empty token when none is stored', async () => {
    await expect(fetchOptions.auth.token()).resolves.toBe('');
  });

  it('persists the set-auth-token header on a successful response', async () => {
    const ctx = {
      response: { headers: { get: (name: string) => (name === 'set-auth-token' ? 'new-tok' : null) } },
    };
    await fetchOptions.onSuccess(ctx);
    expect(browserState.store.get('bearerToken')).toBe('new-tok');
  });

  it('does not store a token when the header is absent', async () => {
    const ctx = { response: { headers: { get: () => null } } };
    await fetchOptions.onSuccess(ctx);
    expect(browserState.store.has('bearerToken')).toBe(false);
  });
});
