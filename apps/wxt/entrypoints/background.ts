import authClient from "@/utils/auth";
import protectedFetch from "@/utils/background.protectedFetch";

import type { Cache, UrlCacheData } from '@/typings/global.js';
import { addBananaDelta } from "@/utils/background.bananaSync";

const apiUrl = import.meta.env.WXT_API_URL;
if (!apiUrl) throw new Error('WXT_API_URL env var must not be empty');

/** How long a cached jungle-status lookup stays fresh. */
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export default defineBackground(() => {
    // fn to fetch the user's stash + jungle urls and store them for the popup
    const refreshPopupInfo = async () => {
        const res = await protectedFetch(apiUrl + '/users/popup-info', {
            method: 'GET',
        });

        const { stash, jungleUrls } = await res.json();
        await browser.storage.local.set({ stash, jungleUrls });
    };

    // fn to call in handler catch callbacks
    const handlerError = (
        err: { message: string },
        sendResponse: (res: { ok: boolean, error: string}) => void
    ) => {
        console.error("[Junglify] handler error:", err);
        sendResponse({ ok: false, error: err.message });
    };

    /* handle cahced storage updates */
    const handleCacheUpdate = async (
        cacheName: string,
        key: string,
        value: Cache[string],
    ) => {
        const stored = await browser.storage.local.get(cacheName);
        const cache: Cache = (stored[cacheName] as Cache | undefined) ?? {};
        cache[key] = value;
        await browser.storage.local.set({ [cacheName]: cache });
        return { ok: true };
    }

    /* handle user auth changes */
    const handleLogIn = async (token: string) => {
        // store the token first so the popup-info fetch is authenticated and
        // we don't race the auth client's onSuccess token write
        if (token) await browser.storage.local.set({ bearerToken: token });
        await refreshPopupInfo();
        return { ok: true };
    }

    const handleLogOut = async () => {
        await authClient.signOut();
        await browser.storage.local.remove('bearerToken');
        return { ok: true }
    }

    /* plant a jungle at the given url on the user's behalf */
    const handlePlantJungle = async (url: string) => {
        const res = await protectedFetch(apiUrl + '/jungles/create/user', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ url }),
        });

        const { error, newSeedCount } =
            await res.json() as { error?: string, newSeedCount?: number };

        // keep the stored jungleUrls list in sync so the popup reflects the new jungle
        if (!error) {
            const { jungleUrls = [] }: { jungleUrls?: string[] } =
                await browser.storage.local.get('jungleUrls');
            if (!jungleUrls.includes(url)) {
                await browser.storage.local.set({ jungleUrls: [url, ...jungleUrls] });
            }
        }

        // update the urlCache
        await handleCacheUpdate('urlCache', url, {
            expires: Date.now() + CACHE_TTL_MS,
            data: {
                isJungle: true,
                jungle: {
                    growthStage: 0,
                    hasStash: false,
                },
            }
        });

        // tell the content script to show the ui (content scripts only
        // receive messages addressed to their tab, not runtime broadcasts)
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
            browser.tabs.sendMessage(tab.id, {
                type: 'REFRESH_CURRENT_URL',
                url: url,
            }).catch(() => {});
        }

        return { ok: res.ok, status: res.status, newSeedCount, error };
    }

    /* hide a user's stash at a given jungle url */
    const handleHideStash = async (url: string) => {
        const res = await protectedFetch(apiUrl +'/stashes/create', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ url }),
        });

        const { error } = await res.json() as { error?: string };

        if (res.ok) {
            await browser.storage.local.set({ stash: { url, banana_count: 0 } });
        }

        return { ok: res.ok, status: res.status, error };
    }

    /* handle jungle url lookups */
    const handleJungleLookup = async (url: string) => {
        const { urlCache = {} }: { urlCache?: Cache<UrlCacheData> } =
            await browser.storage.local.get('urlCache');
        const cacheVal = urlCache[url];

        let urlInfo: UrlCacheData;

        if (cacheVal?.expires && cacheVal.expires > Date.now()) {
            urlInfo = cacheVal.data;
        } else {
            const res = await fetch(
                apiUrl + '/jungles?url=' + url,
                { method: 'GET' },
            );

            const { growthStage, hasStash } = await res.json();

            urlInfo = {
                isJungle: res.ok,
                jungle: res.ok ? { growthStage, hasStash } : null,
            };
        }

        await handleCacheUpdate('urlCache', url, {
            expires: Date.now() + CACHE_TTL_MS,
            data: urlInfo,
        });

        return { urlInfo };
    }

    /* listen for tab changes */
    browser.tabs.onActivated.addListener(async ({ tabId }) => {
        const tab = await browser.tabs.get(tabId);
        if (!tab.url) return;

        browser.tabs.sendMessage(tabId, {
            type: 'TAB_ACTIVATED',
            url: tab.url,
        }).catch(() => {});
    })

    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.url) {
            browser.tabs.sendMessage(tabId, {
                type: 'TAB_UPDATED',
                url: tab.url,
            }).catch(() => {});
        }
    })

    /* listen for messages from the popup and the content scripts */
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        switch (message.type) {
            case 'LOG_IN':
                handleLogIn(message.token)
                    .then(sendResponse)
                    .catch((err) => handlerError(err, sendResponse));
                return true;

            case 'LOG_OUT':
                handleLogOut()
                    .then(sendResponse)
                    .catch((err) => handlerError(err, sendResponse));
                return true;

            case 'PLANT_JUNGLE':
                handlePlantJungle(message.url)
                    .then(sendResponse)
                    .catch((err) => handlerError(err, sendResponse));
                return true;

            case 'HIDE_STASH':
                handleHideStash(message.url)
                    .then(sendResponse)
                    .catch((err) => handlerError(err, sendResponse));
                return true;

            case 'ADD_BANANA_DELTA':
                addBananaDelta(message.delta)
                    .then(sendResponse)
                    .catch((err) => handlerError(err, sendResponse));
                return true;

            case 'JUNGLE_LOOKUP':
                handleJungleLookup(message.url)
                    .then(sendResponse)
                    .catch((err) => handlerError(err, sendResponse));
                return true;

            default:
                return false;
        }
    });

    /* startup routine */
    void (async () => {
        /* scrub cached data for expired info */
        const toBeScrubbed = ['urlCache'];

        for (const cacheName of toBeScrubbed) {
            const stored = await browser.storage.local.get(cacheName);
            const cache = stored[cacheName] as Cache | undefined;

            if (cache) {
                let foundExpired = false;

                for (const key of Object.keys(cache)) {
                    const entry = cache[key];
                    if (entry?.expires && entry.expires <= Date.now()) {
                        delete cache[key];
                        foundExpired = true;
                    }
                }

                if (foundExpired) await browser.storage.local.set({ [cacheName]: cache });
            }
        }

        /* initial token validation check and popup info fetch */
        let tokenIsValid = true;

        try {
            await authClient.getSession({
                fetchOptions: {
                    async onError() {
                        await browser.storage.local.remove('bearerToken');
                        tokenIsValid = false;
                    }
                }
            });
        } catch (error) {
            console.log(error);
            await browser.storage.local.remove('bearerToken');
            tokenIsValid = false;
        }

        if (tokenIsValid) {
            try {
                await refreshPopupInfo();
            } catch (error) {
                console.log(error);
            }
        }
    })();
});
