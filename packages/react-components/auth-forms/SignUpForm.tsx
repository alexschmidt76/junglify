import { useState } from 'react';

import type { JungleAuthClient } from '@repo/auth/auth-client';

import FormError from '../misc/FormError';

export default function SignUpForm(
    { authClient, callbackFn, onNavigate }: {
        authClient: JungleAuthClient,
        callbackFn: (...params: string[]) => void | Promise<void>,
        // when provided (e.g. the extension popup's router), intercept in-app
        // links instead of letting the anchor do a full-page navigation
        onNavigate?: (path: string) => void,
    }
) {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const isValidUsername = /^[a-zA-Z0-9_-]{3,20}$/.test(username);
        if (!isValidUsername) {
            setError(`Username may not contain any spaces or special characters other than "-" and "_"`);
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        await authClient.signUp.email({
            email: email.trim(),
            username: username.trim(),
            password: password.trim(),
            name: "",
            fetchOptions: {
                onRequest() {
                    setLoading(true);
                },
                async onSuccess(ctx) {
                    const username = ctx.data?.user?.username;
                    const token = await ctx.response.headers.get('set-auth-token') || '';
                    await callbackFn(username, token);
                },
                onError(ctx) {
                    setLoading(false);
                    setError(ctx.error?.message);
                },
            }
        });

    }

    return (
        <div className='mx-auto flex w-80 flex-col rounded-2xl bg-green-950 p-4 text-amber-50'>
            <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                <h1 className='text-center text-xl font-extrabold tracking-wide text-green-400'>Sign Up for Junglify</h1>
                <p className='text-center text-xs text-amber-100/70'>
                    Already have an account?{' '}
                    <a href='/log-in' onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate('/log-in'); } : undefined} className='font-semibold text-green-400 hover:text-green-300'>Log in here</a>.
                </p>
                <div className='flex flex-col gap-3 [&_label]:text-xs [&_label]:font-semibold [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-amber-100/80 [&_input]:rounded-md [&_input]:border [&_input]:border-amber-900/50 [&_input]:bg-amber-950/40 [&_input]:px-2 [&_input]:py-1 [&_input]:text-sm [&_input]:text-amber-50 [&_input]:outline-none [&_input]:focus:border-green-500'>
                    <div className='flex flex-col gap-1'>
                        <label>Email</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
                    </div>
                    <div className='flex flex-col gap-1'>
                        <label>Username</label>
                        <input value={username} onChange={e => setUsername(e.target.value)} type="text" required />
                    </div>
                    <div className='flex flex-col gap-1'>
                        <label>Password</label>
                        <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
                    </div>
                    <div className='flex flex-col gap-1'>
                        <label>Confirm Password</label>
                        <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" required />
                    </div>
                    { error && <FormError message={error} /> }
                </div>
                <button type="submit" className='mt-1 w-full rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-green-500 hover:cursor-pointer disabled:opacity-60'>
                    { loading ? 'Creating your account...' : 'Sign Up' }
                </button>
            </form>
        </div>
    )
}
