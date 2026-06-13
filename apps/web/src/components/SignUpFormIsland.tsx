import SignUpForm from "@repo/react-components/auth-forms/SignUpForm";
import authClient from "../auth/auth-client";

export default function SignUpFormIsland() {
    const url = import.meta.env.PUBLIC_JUNGLIFY_WEBSITE_URL + '/users';
    return <SignUpForm authClient={authClient} redirectUrl={url} />
}