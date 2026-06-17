import urlCleaner from '../utils/urlCleaner.ts';
import cacheUpdate from '@/utils/cacheUpdate.ts';

import { UrlCache } from '@/typings/cache.js';

const apiUrl = process.env.WXT_API_URL || '';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  async main() {
    // runs every time a new url is hit
    const onUrlChange = async (url: string) => {
      console.log("URL changed to:", url);

      const cleanUrl = urlCleaner(url);
      let urlInfo: {
        isJungle: boolean,
        jungle: {
          growthStage: number,
          hasStash: boolean
        } | null,
      }; 

      const urlCache: UrlCache = await browser.storage.local.get('urlCache');
      const cacheVal = urlCache[cleanUrl];

      if (cacheVal && cacheVal.expires && cacheVal.expires > Date.now()) {
        urlInfo = cacheVal.data;
      } else {
        if (cacheVal && cacheVal.expires && cacheVal.expires <= Date.now()) {
          delete urlCache[cleanUrl];
        }

        const res = await fetch(apiUrl + '/jungles?url=' + cleanUrl, {
          method: 'GET'
        });

        const { growthStage, hasStash } = await res.json();

        urlInfo = {
          isJungle: res.ok,
          jungle: 
            res.ok 
            ? { growthStage: growthStage, hasStash: hasStash } 
            : null,
        }

        await cacheUpdate('urlCache', urlInfo);
      }

      console.log('this url', urlInfo.isJungle ? 'is' : 'is not', 'a jungle');
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
