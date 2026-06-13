import { useState } from "react";
import authClient from "../auth/auth-client"
import FormError from "@repo/react-components/FormError";

export default function ProfileSettings({ username }: { username: string }) {
    const [loggingOut, setLoggingOut] = useState(false);
    const [error, setError] = useState('');

    const logOut = async () => {
        setLoggingOut(true);

        const result = await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    window.location.href = '/'; // redirect to home page
                }
            }
        });

        if (result.error) {
            setLoggingOut(false);
            setError(error);
        }
    }

    return (
        <div>
            <h1>{username}'s Settings</h1>
            { error && <FormError message={error} /> }
            <button onClick={logOut}>
                { loggingOut ? 'Logging Out...' : 'Log Out' }
            </button>
        </div>
    )
}