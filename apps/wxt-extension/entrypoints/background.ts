import authClient from "@/utils/auth";
import { protectedFetch } from "@/utils/protectedFetch";

const apiUrl = process.env.WXT_API_URL || '';

export default defineBackground(() => {
    void (async () => {
        let isValid = true;

        try {
            await authClient.getSession({
                fetchOptions: {
                    async onError() {
                        await browser.storage.local.remove('bearerToken');
                        isValid = false;
                    }
                }
            });
        } catch (error) {
            console.log(error);
            await browser.storage.local.remove('bearerToken');
            isValid = false;
        }

        if (isValid) {
            try {
                const res = await protectedFetch(apiUrl + '/users/popup-info', {
                    method: 'GET'
                });
        
                const {stash, jungleUrls} = await res.json();
                await browser.storage.local.set({ stash, jungleUrls });
            } catch (error) {
                console.log(error);
            }
        }
                

        /* scrub cached data for expired info */

        /* concerning fetching jungles */
        
    })();
});