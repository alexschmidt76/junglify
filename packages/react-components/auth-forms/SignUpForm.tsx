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
        <form onSubmit={handleSubmit}>
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
            <button type="submit">Sign Up</button>
        </form>
    )
}