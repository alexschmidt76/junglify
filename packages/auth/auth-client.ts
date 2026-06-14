import { createAuthClient, SuccessContext } from "better-auth/client";
import { usernameClient, adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { AuthType } from "../../apps/api/lib/auth/auth.js";

type FetchOptions = {
    onSuccess(ctx: SuccessContext): void;
    auth: {
        type: string;
        token: () => Promise<string>;
    };
}

const getAuthClient = (baseURL: string, fetchOptions?: FetchOptions) => createAuthClient({
    baseURL,
    plugins: [usernameClient(), adminClient(), inferAdditionalFields<AuthType>()],
    fetchOptions: fetchOptions ? fetchOptions : {}
});

export type JungleAuthClient = ReturnType<typeof getAuthClient>;

export default getAuthClient;