import authClient from '../utils/auth.ts';

export default defineBackground(async () => {
    // check for stored session
    const { localSession } = await browser.storage.local.get('session');

    if (localSession) {
        // verify that it's valid server-side
        await authClient.getSession({
            fetchOptions: {
                onSuccess(context) {
                    
                },
            }
        })
    }
});