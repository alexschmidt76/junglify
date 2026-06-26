import authClient from './auth';

/**
 * Fetch wrapper for protected backend endpoints. Attaches the stored bearer
 * token, and on a 401/403 clears the token and re-evaluates the session so the
 * Better Auth session store (authClient.useSession) updates and the popup
 * reflects the logged-out state.
 */
const protectedFetch = async (
   input: string,
   init: RequestInit = {},
): Promise<Response> => {
   const { bearerToken }: { bearerToken?: string } =
      await browser.storage.local.get('bearerToken');

   const headers = new Headers(init.headers);
   if (bearerToken) headers.set('Authorization', `Bearer ${bearerToken}`);

   const res = await fetch(input, { ...init, headers });

   if (res.status === 401 || res.status === 403) {
      await browser.storage.local.remove('bearerToken');
      // refetch the session so the useSession store invalidates and re-renders
      await authClient.getSession();
   }

   return res;
};

export default protectedFetch;