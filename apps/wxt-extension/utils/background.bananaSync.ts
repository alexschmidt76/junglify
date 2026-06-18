const ALARM_NAME = 'banana-flush-check';
const FLUSH_AFTER_MS = 60_000;

const apiUrl = import.meta.env.WXT_API_URL as string;
if (!apiUrl) throw new Error('WXT_API_URL must not be null');

interface SyncState {
    pendingDelta: number;
    firstPendingAt: number | null; // timestamp of the oldest un-flushed data
}

const getState = async (): Promise<SyncState> => {
    const { bananaSync } = 
        await browser.storage.local.get('bananaSync') as { bananaSync?: SyncState };
    return bananaSync ?? { pendingDelta: 0, firstPendingAt: null };
}

const setState = async (state: SyncState) => {
    await browser.storage.local.set({ bananaSync: state });
}

const flush = async () => {
    const state = await getState();
    if (state.pendingDelta === 0) return;

    // reset eagerly so events arriving mid-request aren't lost
    const deltaToSend = state.pendingDelta;
    await setState({ pendingDelta: 0, firstPendingAt: null });

    try {
        await fetch ()
    }
}

const ensureAlarmScheduled = () => {}

const addBananaDelta = async (delta: number) => {
    const state = await getState();
    state.pendingDelta += delta;
    if (state.firstPendingAt === null) state.firstPendingAt = Date.now();
    await setState(state);

    if (Date.now() - state.firstPendingAt >= FLUSH_AFTER_MS) await flush();
    else ensureAlarmScheduled();
}

export default addBananaDelta;