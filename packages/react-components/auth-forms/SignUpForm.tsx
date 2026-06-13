import { useState } from 'react';
import type { JungleAuthClient } from '@repo/auth/auth-client';

export default function SignUpForm({ authClient }: { authClient: JungleAuthClient }) {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorType, setErrorType] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const isValidUsername = /^[a-zA-Z0-9_-]{3,20}$/.test(username);
        if (!isValidUsername) {
            setErrorType("username");
            setError(`Username may not contain any spaces or special characters other than "-" and "_"`)
        }
        
        if (password !== confirmPassword) {
            setErrorType("password");
            setError("Passwords do not match");
            return;
        }

        const response = await authClient.signUp.email({
            email: email, username: username, password: password, name: ""
        });

        if (response.error) {
            setErrorType("backend");
            setError(response.error.message ?? "Something went wrong");
        }
    }

    return (
        <div className='flex mx-auto p-8 justify-center bg-black text-xl text-green-600 rounded-2xl'>
            <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                <h1 className='text-green-500 text-2xl font-bold mx-auto'>Sign Up for Junglify</h1>
                <p className='text-white/50 text-lg'>Already have an account? <a href='/log-in' className='text-green-800 hover:font-bold'>Log In</a> here.</p>
                <div className='flex flex-col mx-auto [&_input]:bg-white/80 [&_input]:rounded-sm [&_input]:text-black [&_input]:px-0.5'>
                    <label>Email</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
                    { errorType === "username" && <p>{error}</p>}
                    <label>Username</label>
                    <input value={username} onChange={e => setUsername(e.target.value)} type="username" required />
                    { errorType === "password" && <p>{error}</p>}
                    <label>Password</label>
                    <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
                    <label>Confirm Password</label>
                    <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" required />
                    { errorType === "backend" && <p>{error}</p> }
                </div>
                <button type="submit" className='hover:cursor-pointer bg-green-600 text-black font-semibold rounded-lg px-2 pt-0.5 pb-1 mx-auto hover:bg-green-500'>Sign Up</button>
            </form>
        </div>
    )
}