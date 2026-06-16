import authClient from '../utils/auth.ts';
import getAuthUser from '../utils/backgroundHelpers.ts';

export default defineBackground(() => {
    void (async () => {
        const authUser = await getAuthUsers(authClient);
        
        if (!authUser) return;
        
        /* get info for popup */
        try {
            const res = await fetch(apiUrl + `/jungles?url=${msg.url}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${bearerToken ?? ''}`
                }
            });
            
            const data = await res.json());
            await browser.local.set('stash', data.stash);
            await browser.local.set('jungleUrls' = data.jungleUrls);
        } catch (error) {
            console.log(error)
        } 
        
        /* concerning fetching jungles */
        const cache = new Map<string, { isJungle: boolean, expires: Date() | null>();
        
        browser.runtime.onMessage.addListener(async (msg) => {
            if (msg.type === 'IS_JUNGLE') {
                if (cache.has(msg.url) {
                    const { isJungle, expires } = cache.get(msg.url);
                    if (!expires || Date.now() < expires) return isJungle;
                }
                
                try {
                    const { bearerToken } = await browser.storage.local.get('bearerToken');

                    const res = await fetch(apiUrl + `/jungles?url=${msg.url}`, {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${bearerToken ?? ''}`
                        }
                    });
                    
                    const isJungle = res.status !== 404;
                    cache.set(url, { isJungle: isJungle, expires: isJungle ? null : Date.now() + (5  * 60 * 1000));
                    return isJungle;
                } catch (error) {
                    console.log(error);
                    return false;
                } 
            }
        } 
    })();
});