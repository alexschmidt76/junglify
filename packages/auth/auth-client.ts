import { createAuthClient, SuccessContext } from "better-auth/client";
import { usernameClient } from "better-auth/client/plugins";

type FetchOptions = {
    onSuccess(ctx: SuccessContext): void;
    auth: {
        type: string;
        token: () => Promise<string>;
    };
}

const getAuthClient = (baseURL: string, fetchOptions?: FetchOptions) => createAuthClient({
    baseURL,
    plugins: [usernameClient()],
    fetchOptions: fetchOptions ? fetchOptions : {}
});

export type JungleAuthClient = ReturnType<typeof getAuthClient>;

export default getAuthClient;