import authClient from "@/utils/auth";
import protectedFetch from "@/utils/protectedFetch";

import type Cache from '@/typings/cache.js';

const apiUrl = process.env.WXT_API_URL || '';

export default defineBackground(() => {
    void (async () => {
        /* scrub cached data for expired info */
        const toBeScrubbed = ['urlCache'];

        for (const cacheName of toBeScrubbed) {
            const cache: Cache = await browser.storage.local.get(cacheName);

            if (cache) {
                let foundExpired = false;

                for (const key of Object.keys(cache)) {
                    if (cache[key]?.expires && cache[key].expires <= Date.now()) {
                        delete cache[key];
                        foundExpired = true;
                    }
                }

                if (foundExpired) await browser.storage.local.set({ [cacheName]: cache });
            }
        }

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
                const res = await protectedFetch(apiUrl + '/users/popup-info', {
                    method: 'GET'
                });
        
                const {stash, jungleUrls} = await res.json();
                await browser.storage.local.set({ stash, jungleUrls });
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
            { cacheName, data }: { 
                cacheName: string,  
                data: object,
            }
        ) => {
            await browser.storage.local.set({ [cacheName]: data });
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
        const handleLogIn = async () => {
            const res = await protectedFetch(apiUrl + '/users/popup-info', {
                method: 'GET'
            });
    
            const {stash, jungleUrls} = await res.json();
            await browser.storage.local.set({ stash, jungleUrls });

            return { ok: true };
        }

        browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
            if (message.type === 'LOG_IN') {
                handleLogIn()
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