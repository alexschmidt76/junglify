import { installFakeBrowser } from './fakeBrowser';

// WXT auto-imports `browser` into every module. Install the fake before any
// entrypoint/util module is imported so top-level listener registration works.
installFakeBrowser();
