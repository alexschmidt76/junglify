import { vi } from 'vitest';

/**
 * A small in-memory stand-in for the WebExtension `browser` global that WXT
 * auto-imports into every entrypoint. The real object is provided by the
 * browser at runtime, so under test we install this fake on `globalThis`.
 *
 * Both the setup file and the test files import this module, so they share the
 * same singleton state (ES modules are evaluated once).
 */

type Listener = (...args: unknown[]) => void;

export const browserState = {
  store: new Map<string, unknown>(),
  messages: [] as unknown[],
  alarmListeners: [] as Listener[],
  startupListeners: [] as Listener[],
};

/** Clear stored data and recorded messages. Listeners registered at import
 * time are intentionally kept so re-running tests doesn't drop them. */
export function resetBrowserState(): void {
  browserState.store.clear();
  browserState.messages = [];
}

/** Seed a key into local storage, mirroring `browser.storage.local.set`. */
export function seedStorage(key: string, value: unknown): void {
  browserState.store.set(key, value);
}

export const fakeBrowser = {
  storage: {
    local: {
      get: vi.fn(async (key: string) => {
        if (browserState.store.has(key)) return { [key]: browserState.store.get(key) };
        return {};
      }),
      set: vi.fn(async (obj: Record<string, unknown>) => {
        for (const [key, value] of Object.entries(obj)) browserState.store.set(key, value);
      }),
      remove: vi.fn(async (key: string) => {
        browserState.store.delete(key);
      }),
    },
  },
  runtime: {
    sendMessage: vi.fn((msg: unknown) => {
      browserState.messages.push(msg);
    }),
    onStartup: {
      addListener: vi.fn((cb: Listener) => {
        browserState.startupListeners.push(cb);
      }),
    },
  },
  alarms: {
    create: vi.fn(),
    onAlarm: {
      addListener: vi.fn((cb: Listener) => {
        browserState.alarmListeners.push(cb);
      }),
    },
  },
};

export function installFakeBrowser(): void {
  (globalThis as unknown as { browser: typeof fakeBrowser }).browser = fakeBrowser;
}
