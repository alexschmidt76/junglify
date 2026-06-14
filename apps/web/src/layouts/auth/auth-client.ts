import getAuthClient from "@repo/auth/auth-client";

const authClient = getAuthClient(import.meta.env.PUBLIC_BETTER_AUTH_URL);

export default authClient;