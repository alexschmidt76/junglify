import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': __dirname,
    },
  },
  test: {
    // React islands need a DOM to render into
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/web.setup.ts'],
    // the islands read PUBLIC_* config off import.meta.env
    env: {
      PUBLIC_BETTER_AUTH_URL: 'https://auth.test',
      PUBLIC_JUNGLIFY_WEBSITE_URL: 'https://junglify.test',
    },
  },
});
