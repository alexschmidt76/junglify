import SignUpForm from "@repo/react-components/auth-forms/SignUpForm";
import authClient from "../auth/auth-client";

export default function SignUpFormIsland() {
    return <SignUpForm authClient={authClient} />
}