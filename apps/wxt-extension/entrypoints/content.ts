import urlCleaner from '../utils/urlCleaner.ts';
import cacheUpdate from '@/utils/cacheUpdate.ts';

import type { UrlCache, UrlCacheItem } from '@/typings/cache.js';

const apiUrl = import.meta.env.WXT_API_URL;
if (!apiUrl) throw new Error('WXT_API_URL env var must not be empty');

/** How long a cached jungle-status lookup stays fresh. */
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  async main() {
    // runs every time a new url is hit
    const onUrlChange = async (url: string) => {
      console.log("URL changed to:", url);

      const cleanUrl = urlCleaner(url);

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

      console.log('this url', urlInfo.isJungle ? 'is' : 'is not', 'a jungle');
      if (urlInfo.isJungle) console.log('this jungle is', urlInfo.jungle?.hasStash ? '' : 'not', 'a stash.');
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
