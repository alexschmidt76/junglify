import LogInForm from "@repo/react-components/auth-forms/LogInForm";
import authClient from "../auth/auth-client";

export default function LogInFormIsland() {
    return <LogInForm authClient={authClient} />
}