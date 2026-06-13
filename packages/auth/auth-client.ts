import { createAuthClient } from "better-auth/client";
import { usernameClient } from "better-auth/client/plugins";

const getAuthClient = (baseURL: string, fetchOptions: object = {}) => createAuthClient({
    baseURL,
    plugins: [usernameClient()],
    fetchOptions
})

export type JungleAuthClient = ReturnType<typeof getAuthClient>;

export default getAuthClient;