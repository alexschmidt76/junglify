import authClient from '../auth';

const apiUrl = process.env.WXT_API_URL || '';

export const getAuthUser = async () => {
   // check for stored token
   let { bearerToken } = await browser.storage.local.get('bearerToken');

   // nobody is logged in on this browser
   if (!bearerToken) return false;

   // verify that the token is still valid server-side
   await authClient.getSession({
      fetchOptions: {
         // remove the bearerToken if it's no longer valid
         async onError() {
            await browser.storage.local.remove('bearerToken');
            bearerToken = null;
         },
      },
   });

   return bearerToken;
}

export const getPopupInfo = async (token: string) => {
    try {
        const res = await fetch(apiUrl + '/users/popup-info', {
            method: 'GET',
            headers: {
                Authorization: `Bearer: ${token}`,
            },
        });

        const data = await res.json();

        return { status: res.status, ...data }
    }
}