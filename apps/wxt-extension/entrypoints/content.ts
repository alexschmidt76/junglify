import cleanUrl from '../utils/urlCleaner.ts';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    const url = cleanUrl(window.location.href);
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    
    
  },
});
