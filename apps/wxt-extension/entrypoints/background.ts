import authClient from '../utils/auth.ts';

export default defineBackground(async () => {
    // check for stored token
    const { bearerToken } = await browser.storage.local.get('bearerToken');

    // nobody is logged in on this browser
    if (!bearerToken) return;   

    // verify that the token is still valid server-side
    await authClient.getSession({
        fetchOptions: {
            // remove the bearerToken if it's no longer valid
            async onError() {
                await browser.storage.local.remove('bearerToken');
                return;
            }
        }
    });
});