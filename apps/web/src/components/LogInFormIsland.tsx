import LogInForm from "@repo/react-components/auth-forms/LogInForm";
import authClient from "../auth/auth-client";

export default function SignInFormIsland() {
    return <LogInForm authClient={authClient} redirectType="WEB" />
}