// bananaSync stages changes in the current user's bananas,
// then sends the update to the api at most once per minute
import type { Stash } from '../typings/global';

const apiUrl = import.meta.env.WXT_API_URL as string;
if (!apiUrl) throw new Error('WXT_API_URL must not be null');

const DELAY_IN_MS = 60_000;

interface SyncState {
    pendingDelta: number;
    firstPendingAt: number | null; // timestamp of the oldest un-flushed data
}

const defaultState = {
    pendingDelta: 0,
    firstPendingAt: null,
} as SyncState;

const getState = async (): Promise<SyncState> => {
    const { bananaSync } = 
        await browser.storage.local.get('bananaSync') as { bananaSync?: SyncState };
    return bananaSync ?? defaultState;
}

const setState = async (state: SyncState) => {
    await browser.storage.local.set({ bananaSync: state });
}

const flush = async () => {
    const state = await getState();
    if (state.pendingDelta === 0) return;

    // reset eagerly so events arriving mid-request aren't lost
    const deltaToSend = state.pendingDelta;
    await setState(defaultState);

    try {
        const stashUrl = 
            (await browser.storage.local.get('stash') as {  stash: Stash }).stash.url;
            
        await fetch(apiUrl + '/stashes/update?url=' + stashUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application-json' },
            body: JSON.stringify({ delta: deltaToSend }),
        });
    } catch (error) {
        console.log('banana flush failed, re-queuing', error);
        const retryState = await getState();
        await setState({
            pendingDelta: retryState.pendingDelta + deltaToSend,
            firstPendingAt: retryState.firstPendingAt ?? Date.now(),
        });
    }
}

browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'banana-flush-check') flush();
});

browser.runtime.onStartup.addListener(() => { 
    flush(); 
});

const ensureAlarmScheduled = () => {
    browser.alarms.create('banana-flush-check', { delayInMinutes: DELAY_IN_MS / 60_000 });
}

export const addBananaDelta = async (delta: number) => {
    const state = await getState();
    state.pendingDelta += delta;
    if (state.firstPendingAt === null) state.firstPendingAt = Date.now();
    await setState(state);

    if (Date.now() - state.firstPendingAt >= DELAY_IN_MS) await flush();
    else ensureAlarmScheduled();
}