import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resetBrowserState, seedStorage, browserState, fakeBrowser } from './fakeBrowser';

// auth.ts reads import.meta.env and builds a real Better Auth client at import;
// stub it so we only exercise protectedFetch's own logic.
vi.mock('@/utils/auth', () => ({
  default: { getSession: vi.fn() },
}));

import authClient from '@/utils/auth';
import protectedFetch from '@/utils/background.protectedFetch';

function stubFetch(status: number) {
  const fetchMock = vi.fn(
    async (_input: string, _init?: RequestInit) => ({ status }) as unknown as Response,
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('protectedFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetBrowserState();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('attaches the stored bearer token as an Authorization header', async () => {
    seedStorage('bearerToken', 'tok123');
    const fetchMock = stubFetch(200);

    await protectedFetch('https://api.test/x', { method: 'GET' });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer tok123');
  });

  it('sends no Authorization header when no token is stored', async () => {
    const fetchMock = stubFetch(200);

    await protectedFetch('https://api.test/x');

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Headers).get('Authorization')).toBeNull();
  });

  it('preserves caller-provided headers', async () => {
    const fetchMock = stubFetch(200);

    await protectedFetch('https://api.test/x', { headers: { 'Content-Type': 'application/json' } });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Headers).get('Content-Type')).toBe('application/json');
  });

  it('returns the fetch response unchanged', async () => {
    stubFetch(200);
    const res = await protectedFetch('https://api.test/x');
    expect(res.status).toBe(200);
  });

  it('clears the token and re-evaluates the session on 401', async () => {
    seedStorage('bearerToken', 'tok');
    stubFetch(401);

    await protectedFetch('https://api.test/x');

    expect(fakeBrowser.storage.local.remove).toHaveBeenCalledWith('bearerToken');
    expect(browserState.store.has('bearerToken')).toBe(false);
    expect(authClient.getSession).toHaveBeenCalledTimes(1);
  });

  it('clears the token and re-evaluates the session on 403', async () => {
    seedStorage('bearerToken', 'tok');
    stubFetch(403);

    await protectedFetch('https://api.test/x');

    expect(fakeBrowser.storage.local.remove).toHaveBeenCalledWith('bearerToken');
    expect(authClient.getSession).toHaveBeenCalledTimes(1);
  });

  it('leaves the token in place on a successful response', async () => {
    seedStorage('bearerToken', 'tok');
    stubFetch(200);

    await protectedFetch('https://api.test/x');

    expect(fakeBrowser.storage.local.remove).not.toHaveBeenCalled();
    expect(authClient.getSession).not.toHaveBeenCalled();
    expect(browserState.store.get('bearerToken')).toBe('tok');
  });
});
