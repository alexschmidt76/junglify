import { useState } from 'react';

import type { JungleAuthClient } from '@repo/auth/auth-client';
import type { ErrorContext, SuccessContext } from 'better-auth/react';

import FormError from '../FormError';

export default function LogInForm(
    { authClient, callbackFn }: { authClient: JungleAuthClient, callbackFn: (...params: string[]) => void | Promise<void> }
) {
    const [name, setName] = useState("");
    const [password, setPassword] = useState(""); 
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const fetchOptions = {
            onRequest() {
                setLoading(true);
            },
            async onSuccess(ctx: SuccessContext) {
                const username = ctx.data?.user?.username;
                const token = await ctx.response.headers.get('set-auth-token') || '';
                await callbackFn(username, token);
            },
            onError(ctx: ErrorContext) {
                setLoading(false);
                setError(ctx.error?.message);
            }
        }
        
        if (name.includes('@')) {
            await authClient.signIn.email({ 
                email: name.trim(), 
                password: password.trim(),
                fetchOptions: fetchOptions,
            });
        } else {
            await authClient.signIn.username({ 
                username: name.trim(), 
                password: password.trim(), 
                fetchOptions: fetchOptions,
            });
        }
    }

    return (
        <div className='flex mx-auto w-min p-4 bg-black text-xl text-green-600 rounded-2xl'>
            <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                <h1 className='text-green-500 text-2xl font-bold mx-auto'>Log In to Junglify</h1>
                <p className='text-white/50 text-lg mx-auto'>
                    {'New to Junglify? '}
                    <a href='/sign-up' className='text-green-800 hover:font-bold'>
                        Sign Up Here
                    </a>
                </p>
                <div className='flex flex-col mx-auto [&_input]:bg-white/80 [&_input]:rounded-sm'>
                    <div className='flex flex-col mx-auto'>
                        <label>Email/Username</label>
                        <input value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className='flex flex-col mx-auto'>
                        <label>Password</label>
                        <input value={password} onChange={e => setPassword(e.target.value)} type='password' required />
                    </div>
                    { error && <FormError message={error} /> }
                </div>
                <button type='submit' className='bg-green-600 text-black font-semibold rounded-lg px-2 pt-0.5 pb-1 mx-auto hover:bg-green-500 hover:cursor-pointer'>
                    { loading ? 'Logging you in...' : 'Log In' }
                </button>
            </form>
        </div>
    )
}