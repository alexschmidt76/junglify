import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
  test: {
    // jsdom gives the content-script utils a real document/window to work against
    environment: 'jsdom',
    // a fixed document URL so relative-href resolution in the link harvester is deterministic
    environmentOptions: { jsdom: { url: 'https://example.com/' } },
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/wxt.setup.ts'],
    // WXT exposes config through import.meta.env.WXT_*; provide stable test values
    env: {
      WXT_BETTER_AUTH_URL: 'https://auth.test',
      WXT_API_URL: 'https://api.test',
    },
  },
});
