/**
 * Keeps the user's local banana count in sync with the database.
 * 
 * When the banana count changes locally, stage the change 'delta' with
 * addBananaDelta(delta).
 * 
 * When there are staged changes, a call to the api will be made at most once
 * per minute to flush the changes.
 */
import type { Stash } from '../typings/global';
import protectedFetch from './background.protectedFetch';

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

// alarm to tell the browser to flush the staged changes
browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'banana-flush-check') flush();
});

const ensureAlarmScheduled = () => {
    browser.alarms.create('banana-flush-check', { delayInMinutes: DELAY_IN_MS / 60_000 });
}

browser.runtime.onStartup.addListener(() => { 
    flush(); 
});

const flush = async () => {
    const state = await getState();
    if (state.pendingDelta === 0) return;

    // reset the state eagerly so events arriving mid-request aren't lost
    const deltaToSend = state.pendingDelta;
    await setState(defaultState);

    try {
        const stashUrl = 
            (await browser.storage.local.get('stash') as {  stash: Stash }).stash.url;

        await protectedFetch(apiUrl + '/stashes/update/banana-count?url=' + stashUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application-json' },
            body: JSON.stringify({ delta: deltaToSend }),
        });
    } catch (error) {
        // if the patch fails, add the delta back into the current state
        // it will be sent with the next flush
        console.log('banana flush failed, re-queuing', error);
        addBananaDelta(deltaToSend);
    }
}

/**
 * Stage a change in the user's banana count.
 * 
 * Staged changes get flushed every minute.
 * 
 * @param delta Change in bananas
 */
export const addBananaDelta = async (delta: number) => {
    const state = await getState();
    state.pendingDelta += delta;
    if (state.firstPendingAt === null) state.firstPendingAt = Date.now();
    await setState(state);

    if (Date.now() - state.firstPendingAt >= DELAY_IN_MS) await flush();
    else ensureAlarmScheduled();
}