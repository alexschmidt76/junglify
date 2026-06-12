/// <reference types="astro/client" />

interface ImportMetaEnv {
    readonly PUBLIC_BETTER_AUTH_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
