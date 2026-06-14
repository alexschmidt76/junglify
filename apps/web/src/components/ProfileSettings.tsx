import { useState } from "react";
import Popup from "reactjs-popup";
import authClient from "../layouts/auth/auth-client"
import FormError from "../../../../packages/react-components/FormError";

export default function ProfileSettings() {
    const [loggingOut, setLoggingOut] = useState(false);
    const [error, setError] = useState('');
    const [deletingProfile, setDeletingProfile] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');
    const [wrongDeleteInput, setWrongDeleteInput] = useState(false);

    const logOut = async () => {
        if (loggingOut) return;

        await authClient.signOut({
            fetchOptions: {
                onRequest: () => {
                    setLoggingOut(true);
                },
                onSuccess: () => {
                    window.location.href = '/'; // redirect to home page
                },
                onError(ctx) {
                    setLoggingOut(false);
                    setError(ctx.error.message);
                }
            }
        });
    }

    const deleteProfile = async (closeFunc: () => void) => {
        if (deletingProfile) return;

        if (!['delete', `'delete'`].includes(deleteInput)) {
            setWrongDeleteInput(true);
            return;
        }

        setWrongDeleteInput(false);

        await authClient.deleteUser({
            fetchOptions: {
                onRequest() {
                    setDeletingProfile(true);
                },
                onSuccess() {
                    window.location.href = '/'; // redirect to home page
                },
                onError(ctx) {
                    setDeletingProfile(false);
                    setError(ctx.error.message);
                    closeFunc();
                }
            }
        });
    }

    const deleteButton = <button className="text-red-600">Delete Profile</button>

    return (
        <div className="border-gray-900 bg-gray-800/50 text-green-500/40 px-4 py-1 rounded-xl border-2">
            <h1 className="text-2xl font-bold text-green-500/70">Profile Settings</h1>
            <hr className="my-2 border-t-2 border-amber-950" />
            { error && <FormError message={error} /> }
            <button onClick={logOut}>
                { loggingOut ? 'Logging Out...' : 'Log Out' }
            </button>
            <Popup trigger={deleteButton} position="center center">
                <div className="bg-white border-gray-900 text-2xl text-black px-4 py-1">
                    <p>Are you sure you want to delete your Junglify account?</p>
                    <p>If you do, all of your jungles will be abandoned, and your stash will be up for grabs!</p>
                    <div>
                        <p>Type 'delete' into the box below to <b>permanently delete</b> your Junglify account.</p>
                        <form onSubmit={(e) => { e.preventDefault(); deleteProfile(close); }}>
                            <input type="text" value={deleteInput} onChange={(e) => {setDeleteInput(e.target.value)}} />
                            { wrongDeleteInput && <FormError message="Wrong input. Type 'delete'" /> }
                            <button className="bg-red-500 text-white px-4 py-2 rounded-md" type="submit">PERMANENTLY DELETE JUNGLIFY ACCOUNT</button>
                        </form>
                    </div>
                </div>
            </Popup>
        </div>
    )
}