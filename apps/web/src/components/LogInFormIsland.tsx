import LogInForm from "@repo/react-components/auth-forms/LogInForm";
import authClient from "../layouts/auth/auth-client";

export default function SignInFormIsland() {
    const redirectUrl = import.meta.env.PUBLIC_JUNGLIFY_WEBSITE_URL + '/users/';
    return <LogInForm authClient={authClient} callbackFn={(...params: string[]) => { window.location.href = redirectUrl + params[0] }} />
}