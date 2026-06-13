import { useState } from "react";
import LogInForm from '@repo/react-components/auth-forms/LogInForm';
import SignUpForm from '@repo/react-components/auth-forms/SignUpForm';
import authClient from "@/utils/auth";

export default function AuthFormChoice() {
    const [choice, setChoice] = useState<'LOG_IN' | 'SIGN_UP' | null>(null);

    if (choice === 'LOG_IN') return <LogInForm authClient={authClient} />

    if (choice === 'SIGN_UP') return <SignUpForm authClient={authClient} />

    return (
        <></>
    ) 
}