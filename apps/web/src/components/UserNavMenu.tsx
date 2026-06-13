import { useStore } from "better-auth/react";
import authClient from "../auth/auth-client";

export default function UserNavMenu() {
    const session = useStore(authClient.useSession);
    
    if (session.isPending || !session.data) return (
        <p className="text-green-800/80">
            <a href="/sign-up" className="text-green-700 hover:text-green-500 hover:font-bold">Sign Up</a> or <a href="/log-in" className="text-green-700 hover:text-green-500 hover:font-bold">Log In</a>
        </p>
    )

    return (
        <p className="text-green-700">
            Welcome back to the jungle <a href={`/users/${session.data.user.username}`} className="text-green-700 hover:text-green-500 hover:font-bold">{session.data.user.username}</a>!
        </p>
    ) 
}