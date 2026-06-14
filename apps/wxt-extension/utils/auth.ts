import getAuthClient from '@repo/auth/auth-client';
import type { SuccessContext } from 'better-auth/react';

const url = import.meta.env.WXT_BETTER_AUTH_URL || '';

if (!url) throw new Error('WXT_BETTER_AUTH_URL env var cannot be empty');

const fetchOptions = {
    onSuccess(ctx: SuccessContext) {
        const token = ctx.response.headers.get('set-auth-token');
        if (token) browser.storage.local.get({ bearerToken: token });
    },
    auth: {
        type: 'Bearer',
        token: async (): Promise<string> => {
            const { bearerToken }: { bearerToken: string } = await browser.storage.local.get('bearerToken');
            return bearerToken || '';
        }
    }
}

const authClient = getAuthClient(url, fetchOptions);

export default authClient;