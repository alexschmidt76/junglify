import { createAuthClient } from "better-auth/client";
import { usernameClient } from "better-auth/client/plugins";
import { bearer } from "better-auth/plugins";

const getAuthClient = (tokenBearer: boolean = false) => createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL,
    plugins: tokenBearer ? [usernameClient()] : [usernameClient(), bearer()]
});

export type JungleAuthClient = ReturnType<typeof getAuthClient>;

export default getAuthClient;