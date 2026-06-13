import { useState } from "react";
import LogInForm from '@repo/react-components/auth-forms/LogInForm';
import authClient from "@/utils/auth";

const redirectUrl = process.env.

export default function AuthFormChoice() {
    const [choice, setChoice] = useState<'LOG_IN' | 'SIGN_UP' | null>(null);

    if (choice === 'LOG_IN') return <LogInForm authClient={authClient} redirectUrl={redirectUrl} />
}