import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { resetBrowserState, seedStorage, browserState, fakeBrowser } from './fakeBrowser';

// background.bananaSync flushes via protectedFetch (which pulls in the real auth
// client). Stub it so we test the staging/flush bookkeeping in isolation.
vi.mock('@/utils/background.protectedFetch', () => ({ default: vi.fn() }));

type SyncState = { pendingDelta: number; firstPendingAt: number | null };

// bananaSync mutates a module-level default-state object, so each test gets a
// freshly-evaluated module (via resetModules) to stay isolated.
let addBananaDelta: (delta: number) => Promise<void>;
let protectedFetch: Mock;

describe('addBananaDelta', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetBrowserState();
    vi.resetModules();
    protectedFetch = vi.mocked((await import('@/utils/background.protectedFetch')).default);
    ({ addBananaDelta } = await import('@/utils/background.bananaSync'));
  });

  it('ignores the delta when no stash has been hidden yet', async () => {
    await addBananaDelta(5);
    expect(fakeBrowser.storage.local.set).not.toHaveBeenCalled();
    expect(browserState.messages).toEqual([]);
  });

  it('increments the local banana count and broadcasts the update', async () => {
    seedStorage('stash', { url: 'https://x.com', banana_count: 10 });

    await addBananaDelta(3);

    expect(browserState.store.get('stash')).toMatchObject({ banana_count: 13 });
    expect(browserState.messages).toContainEqual({
      type: 'STASH_UPDATE',
      stash: { url: 'https://x.com', banana_count: 13 },
    });
  });

  it('clamps the local banana count at zero', async () => {
    seedStorage('stash', { url: 'https://x.com', banana_count: 2 });
    await addBananaDelta(-10);
    expect(browserState.store.get('stash')).toMatchObject({ banana_count: 0 });
  });

  it('stages the pending delta and schedules a flush alarm instead of flushing immediately', async () => {
    seedStorage('stash', { url: 'https://x.com', banana_count: 5 });

    await addBananaDelta(4);

    const state = browserState.store.get('bananaSync') as SyncState;
    expect(state.pendingDelta).toBe(4);
    expect(typeof state.firstPendingAt).toBe('number');
    expect(fakeBrowser.alarms.create).toHaveBeenCalled();
    expect(protectedFetch).not.toHaveBeenCalled();
  });

  it('flushes to the API when the oldest pending change is older than the delay', async () => {
    seedStorage('stash', { url: 'https://x.com', banana_count: 5 });
    seedStorage('bananaSync', { pendingDelta: 2, firstPendingAt: Date.now() - 70_000 });
    protectedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ banana_count: 50 }),
    } as Response);

    await addBananaDelta(1);

    expect(protectedFetch).toHaveBeenCalledTimes(1);
    const [url, init] = protectedFetch.mock.calls[0]!;
    expect(url).toBe('https://api.test/stashes/update/banana-count');
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(init?.body as string)).toEqual({ delta: 3 });

    // the server's authoritative count is written back and the pending state is reset
    expect(browserState.store.get('stash')).toMatchObject({ banana_count: 50 });
    expect(browserState.store.get('bananaSync')).toEqual({ pendingDelta: 0, firstPendingAt: null });
  });

  it('re-queues the delta when the flush request fails', async () => {
    seedStorage('stash', { url: 'https://x.com', banana_count: 5 });
    seedStorage('bananaSync', { pendingDelta: 2, firstPendingAt: Date.now() - 70_000 });
    protectedFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'nope' }),
    } as Response);

    await addBananaDelta(1);

    // the 3 pending bananas are put back so the next flush retries them
    const state = browserState.store.get('bananaSync') as SyncState;
    expect(state.pendingDelta).toBe(3);
  });
});
