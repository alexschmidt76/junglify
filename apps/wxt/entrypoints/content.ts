import urlCleaner from '../utils/urlCleaner.ts';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';

import type { Cache, UrlCacheData } from '@/typings/global.js';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  async main(ctx) {
    /* create shadow root container over browser window */
    const ui = await createShadowRootUi(ctx, {
      name: 'junglify-overlay',
      position: 'overlay',
      anchor: 'body',
      onMount: (container) => {
        const button = document.createElement('button');
        button.id = 'banana-button';
        button.textContent = '🍌 Get a banana';

        // The overlay host is a 0x0 anchor point, so the button has to position
        // and size itself. Fixed pins it to the viewport (the host's absolute
        // positioning doesn't create a containing block for fixed children),
        // and a near-max z-index keeps it above page content.
        button.style.cssText = [
          'position: fixed',
          'bottom: 20px',
          'right: 20px',
          'z-index: 2147483647',
          'margin: 0',
          'padding: 12px 20px',
          'border: none',
          'border-radius: 9999px',
          'background: #ffcf33',
          'color: #3a2d00',
          'font: 700 16px/1 system-ui, sans-serif',
          'cursor: pointer',
          'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25)',
        ].join(';');

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
      },
    });

    /* runs every time a new url is hit */
    const onUrlChange = async (url: string) => {
      // clean the url and look it up in the cache/database
      const cleanUrl = urlCleaner(url);

      let urlInfo: UrlCacheData | undefined;
      try {
        ({ urlInfo } = await browser.runtime.sendMessage({
          type: 'JUNGLE_LOOKUP',
          url: cleanUrl,
        }));
      } catch (err) {
        console.error("[Junglify] JUNGLE_LOOKUP failed:", err);
        return;
      }

      // only logged-in users can collect bananas, so only show the button to them
      const { bearerToken } = await browser.storage.local.get('bearerToken');

      // mount/remove are not idempotent in WXT — calling mount() again re-runs
      // onMount and stacks another button, so guard on the current mount state
      if (urlInfo?.isJungle && bearerToken) {
        if (!ui.mounted) ui.mount();
      } else if (ui.mounted) {
        ui.remove();
      }
    }

    /* handle updates regarding the current url */
    const handleUrlRefresh = async (url: string) => {
      const { urlCache }: { urlCache?: Cache<UrlCacheData> } = 
        await browser.storage.local.get('urlCache');

      if (urlCache && urlCache[url] && urlCache[url].data.isJungle && !ui.mounted) {
        ui.mount();
      }
    }

    /* listen for messages from the popup and the backend */
    browser.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'REFRESH_CURRENT_URL') {
        handleUrlRefresh(msg.url).catch((err) =>
          console.error("[Junglify] REFRESH_CURRENT_URL handler failed:", err));
      }
    })

    /* tracking spa url changes */
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
        onUrlChange(msg.url);
      }
    });

    // initial script run on launch
    await onUrlChange(location.href);
  },
});
