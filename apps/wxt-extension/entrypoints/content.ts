import urlCleaner from '../utils/urlCleaner.ts';
import cacheUpdate from '@/utils/content.cacheUpdate.ts';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';

import type { UrlCache, UrlCacheItem } from '@/typings/global.js';

const apiUrl = import.meta.env.WXT_API_URL;
if (!apiUrl) throw new Error('WXT_API_URL env var must not be empty');

/** How long a cached jungle-status lookup stays fresh. */
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  async main(ctx) {
    // create shadow root container over browser window
    const ui = await createShadowRootUi(ctx, {
      name: 'banana-button',
      position: 'overlay',
      anchor: 'body',
      onMount: (container) => {
        const button = document.createElement('button');
        button.id = 'banana-button';
        button.textContent = 'Get a banana';
        button.onclick = (e) => {
          e.preventDefault();

          browser.runtime.sendMessage({
            type: 'ADD_BANANA_DELTA',
            delta: 1
          }).catch(error => console.error(error));
        }

        container.appendChild(button);
        return button;
      },
      onRemove: (button) => {
        button?.remove();
      }
    });

    // runs every time a new url is hit
    const onUrlChange = async (url: string) => {
      console.log("URL changed to:", url);

      const cleanUrl = urlCleaner(url);

      // get urlInfo from urlCache or fetch it from the api
      const { urlCache = {} }: { urlCache?: UrlCache } =
        await browser.storage.local.get('urlCache');
      const cacheVal = urlCache[cleanUrl];

      let urlInfo: UrlCacheItem['data'];

      if (cacheVal?.expires && cacheVal.expires > Date.now()) {
        urlInfo = cacheVal.data;
      } else {
        try {
          const res = await fetch(
            apiUrl + '/jungles?url=' + encodeURIComponent(cleanUrl),
            { method: 'GET' },
          );

          const { growthStage, hasStash } = await res.json();

          urlInfo = {
            isJungle: res.ok,
            jungle: res.ok ? { growthStage, hasStash } : null,
          };

          await cacheUpdate('urlCache', cleanUrl, {
            data: urlInfo,
            expires: Date.now() + CACHE_TTL_MS,
          });


        } catch (error) {
          console.warn('[Junglify] jungle lookup failed:', error);
          return;
        }
      }

      // only logged-in users can collect bananas, so only show the button to them
      const { bearerToken } = await browser.storage.local.get('bearerToken');

      if (urlInfo.isJungle && bearerToken) ui.mount();
      else ui.remove();
    }

    // TRACKING SPA URL CHANGES
    const _pushState = history.pushState.bind(history);
    const _replaceState = history.replaceState.bind(history);

    history.pushState = (...args) => {
      _pushState(...args);
      onUrlChange(location.href)
    }

    history.replaceState = (...args) => {
      _replaceState(...args);
      onUrlChange(location.href);
    }

    window.addEventListener('popstate', () => onUrlChange(location.href));

    browser.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'TAB_ACTIVATED' || msg.type === 'TAB_UPDATED') {
        console.log('Active tab URL:', msg.url);
        onUrlChange(msg.url);
      }
    });

    await onUrlChange(location.href);
  },
});
