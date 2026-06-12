import { useState } from 'react';
import type { JungleAuthClient } from '@repo/auth/auth-client';

export default function LogInForm({ authClient }: { authClient: JungleAuthClient }) {
    const [name, setName] = useState("");
    const [password, setPassword] = useState(""); 
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const response = 
            name.includes('@')
            ? await authClient.signIn.email({ email: name, password: password })
            : await authClient.signIn.username({ username: name, password: password });

        if (response.error) {
            setError(response.error.message ?? "Something went wrong");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>Email/Username</label>
            <input value={name} onChange={e => setName(e.target.value)} required />
            <label>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type='password' required />
            { error && <p>{error}</p>}
            <button type='submit'>Log In</button>
        </form>
    )
}