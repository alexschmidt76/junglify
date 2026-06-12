import { createAuthClient } from "better-auth/client";
import { usernameClient } from "better-auth/client/plugins";

const getAuthClient = (baseURL: string) => createAuthClient({
    baseURL,
    plugins: [usernameClient()]
});

export type JungleAuthClient = ReturnType<typeof getAuthClient>;

export default getAuthClient;