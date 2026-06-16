import { getAuthUser, getPopupInfo } from "@/utils/background/helpers";

export default defineBackground(() => {
    void (async () => {
        /* scrub cached data for expired info */

        /* check for a logged in user */
        const token = await getAuthUser();
        
        if (!token) return;
        
        /* get info for popup */
        const { stash, jungleUrls, status, error } = await getPopupInfo(token);

        if (error) {
            console.log(error);
            if (status === 401) {
                // bad token, re-auth
            }
        }

        await browser.storage.local.set('stash', stash);
        await browser.storage.local.set('jungleUrls', jungleUrls);
        
        /* concerning fetching jungles */
        
    })();
});