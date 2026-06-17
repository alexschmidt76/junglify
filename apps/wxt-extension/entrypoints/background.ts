import authClient from "@/utils/auth";
import protectedFetch from "@/utils/protectedFetch";

import type Cache from '@/typings/cache.js';

const apiUrl = import.meta.env.WXT_API_URL;
if (!apiUrl) throw new Error('WXT_API_URL env var must not be empty');

export default defineBackground(() => {
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

        /* fetch the user's stash + jungle urls and cache them for the popup */
        const refreshPopupInfo = async () => {
            const res = await protectedFetch(apiUrl + '/users/popup-info', {
                method: 'GET',
            });

            const { stash, jungleUrls } = await res.json();
            await browser.storage.local.set({ stash, jungleUrls });
        };

        /* initial validation check and popup info fetch */
        let isValid = true;

        try {
            await authClient.getSession({
                fetchOptions: {
                    async onError() {
                        await browser.storage.local.remove('bearerToken');
                        isValid = false;
                    }
                }
            });
        } catch (error) {
            console.log(error);
            await browser.storage.local.remove('bearerToken');
            isValid = false;
        }

        if (isValid) {
            try {
                await refreshPopupInfo();
            } catch (error) {
                console.log(error);
            }
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


        /* listen for browser storage updaets */
        const handleCacheUpdate = async (
            { cacheName, key, value }: {
                cacheName: string,
                key: string,
                value: Cache[string],
            }
        ) => {
            const stored = await browser.storage.local.get(cacheName);
            const cache: Cache = (stored[cacheName] as Cache | undefined) ?? {};
            cache[key] = value;
            await browser.storage.local.set({ [cacheName]: cache });
            return { ok: true };
        }

        browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
            if (message.type === 'UPDATE_CACHE') {
                handleCacheUpdate(message.payload)
                    .then(sendResponse)
                    .catch((err) => {
                        console.error("[Junglify handler error:", err);
                        sendResponse({ ok: false, error: err.message });
                    });

                return true;
            }

            return false;
        });

        /* listen for user auth changes */
        const handleLogIn = async (token: string) => {
            // store the token first so the popup-info fetch is authenticated and
            // we don't race the auth client's onSuccess token write
            if (token) await browser.storage.local.set({ bearerToken: token });
            await refreshPopupInfo();
            return { ok: true };
        }

        browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
            if (message.type === 'LOG_IN') {
                handleLogIn(message.token)
                    .then(sendResponse)
                    .catch((err) => {
                        console.error("[Junglify] handler error:", err);
                        sendResponse({ ok: false, error: err.message });
                    });

                return true;
            }

            return false;
        });

        /* plant a jungle at the given url on the user's behalf */
        const handlePlantJungle = async (url: string) => {
            // no Content-Type header: the API expects a raw string body it can
            // JSON.parse itself (sending application/json makes Vercel pre-parse
            // it to an object and the handler then rejects the request)
            const res = await protectedFetch(apiUrl + '/jungles/create/user', {
                method: 'POST',
                body: JSON.stringify({ url }),
            });

            const { error, newSeedCount }: { error?: string, newSeedCount?: number } =
                await res.json();

            // keep the cached jungle list in sync so the popup reflects the new jungle
            if (!error) {
                const { jungleUrls = [] }: { jungleUrls?: string[] } =
                    await browser.storage.local.get('jungleUrls');
                if (!jungleUrls.includes(url)) {
                    await browser.storage.local.set({ jungleUrls: [url, ...jungleUrls] });
                }
            }

            return { ok: res.ok, status: res.status, newSeedCount, error };
        }

        browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
            if (message.type === 'PLANT_JUNGLE') {
                handlePlantJungle(message.url)
                    .then(sendResponse)
                    .catch((err) => {
                        console.error("[Junglify] handler error:", err);
                        sendResponse({ ok: false, error: err.message });
                    });

                return true;
            }

            return false;
        });

        const handleLogOut = async () => {
            await authClient.signOut();
            await browser.storage.local.remove('bearerToken');
            return { ok: true }
        }

        browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
            if (message.type === 'LOG_OUT') {
                handleLogOut()
                    .then(sendResponse)
                    .catch((err) => {
                        console.error("[Junglify] handler error:", err);
                        sendResponse({ ok: false, error: err.message });
                    });

                return true;
            }

            return false;
        })
    })();
});