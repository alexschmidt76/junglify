// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    vite: {
        preview: {
            allowedHosts: [
                'website-test-production-9009.up.railway.app',
                'junglify.org'
            ]
        },
    },
});
