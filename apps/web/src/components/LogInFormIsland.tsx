import LogInForm from "@repo/react-components/auth-forms/LogInForm";
import authClient from "../auth/auth-client";

export default function SignInFormIsland() {
    const redirectUrl = import.meta.env.PUBLIC_JUNGLIFY_WEBSITE_URL + '/users';
    
    const redirectFn = (username: string) => {
        window.location.href = redirectUrl + username;
    }
    
    return <LogInForm authClient={authClient} redirectFn={redirectFn} />
}