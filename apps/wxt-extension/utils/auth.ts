import getAuthClient from '@repo/auth/auth-client';

const url = process.env.BETTER_AUTH_URL || '';

if (!url) throw new Error('BETTER_AUTH_URL env var cannot be empty');

const authClient = getAuthClient({
    baseUrl: url,
    
});

export default authClient;