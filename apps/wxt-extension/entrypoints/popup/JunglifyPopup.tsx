import { ReactEventHandler, useEffect, useState } from "react";

import type User from '@/types/user';

type StashInfo = {
    url: string,
    banana_count: number
}

export default function JunglifyPopup({ user }: { user: User }) {
    const [stash, setStash] = useState<null | StashInfo>(null);
    const [loading, setLoading] = useState(false);

    const apiUrl = import.meta.env.WXT_API_URL;
    if (!apiUrl) throw new Error('WXT_API_URL env var must not be empty');

    const plantJungle = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();

        try {
            const { bearerToken } = await browser.storage.local.get('bearerToken');

            const res = await fetch(apiUrl + '/jungles/create', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${bearerToken ?? ''}`
                }
            });

            return;
        } catch (err) {
            console.log(err)
        }
    }
    
    useEffect(() => {
        async function fetchStash() {
            setLoading(true);

            try {
                const { bearerToken } = await browser.storage.local.get('bearerToken');

                const res = await fetch(apiUrl + '/stashes/my-stash', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${bearerToken ?? ''}`
                    }
                });

                if (!res.ok) return;

                const data: StashInfo = await res.json();
                setStash(data);
            } finally {
                setLoading(false);
            }
        }

        void fetchStash();
    }, [apiUrl]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="flex w-min">
            <div className="flex flex-col text-2xl">
                {
                    stash ? (
                        <>
                            <p>Stash URL: {stash.url}</p>
                            <p>Bananas: {stash.banana_count}</p>
                        </>    
                    ) : (
                        <>
                            <p>You don't have a stash yet!</p>
                            <p>Go to one of your jungles and hide your stash to start collecting bananas.</p>
                        </>
                    )
                }
            </div>
            <span className="h-128 w-8 mx-4 bg-black rounded-2xl" />
            <div className="flex flex-col text-2xl">
                <p>Seeds: {user.seed_count}</p>
                <button className="border border-black" onClick={(e) => plantJungle(e)}>Plant a jungle here!</button>
            </div>
        </div>
    )
}