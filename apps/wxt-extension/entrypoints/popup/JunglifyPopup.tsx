import { useEffect, useState } from "react";
import cleanUrl from "@/utils/urlCleaner";

import type User from '@repo/utils/types/user';
import FormError from "@repo/react-components/FormError";

type StashInfo = {
    url: string,
    banana_count: number
}

export default function JunglifyPopup({ user }: { user: User }) {
    const [url, setUrl] = useState<string | null>(null);
    const [stash, setStash] = useState<null | StashInfo>(null);
    const [jungleUrls, setJungleUrls] = useState<string[]>([]);
    const [atOwnJungle, setAtOwnJungle] = useState(false);
    const [loading, setLoading] = useState(false);
    const [planting, setPlanting] = useState(false);
    const [seedCount, setSeedCount] = useState(user.seed_count || 0);
    const [plantError, setPlantError] = useState<null | string>(null);

    const apiUrl = import.meta.env.WXT_API_URL;
    if (!apiUrl) throw new Error('WXT_API_URL env var must not be empty');

    const plantJungle = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();

        if (!url) return;

        setPlanting(true);

        try {
            const { bearerToken } = await browser.storage.local.get('bearerToken');

            const response = await fetch(apiUrl + '/jungles/create', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${bearerToken ?? ''}`
                },
                body: JSON.stringify({
                    url: url
                })
            });

            if (response.status === 201) {
                setJungleUrls([url, ...jungleUrls]);
                setSeedCount(seedCount - 1);
                setAtOwnJungle(true);
            } else {
                const data: { error: string } = await response.json();
                setPlantError(data.error);
            }
        } catch (error) {
            console.log(error)
        } finally {
            setPlanting(false);
        }
    }
    
    useEffect(() => {
        if (!url) browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
            if (tab?.url) setUrl(cleanUrl(tab.url));
        });

        async function fetchStash() {
            setLoading(true);

            try {
                const { bearerToken } = await browser.storage.local.get('bearerToken');

                const res = await fetch(apiUrl + '/users/popup-info', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${bearerToken ?? ''}`
                    }
                });

                if (!res.ok) return;

                const data: { stash: StashInfo, jungleUrls: string[] } = await res.json();
                setStash(data.stash);

                const parsedUrls = data.jungleUrls.filter((e): e is string => typeof e === 'string');

                if (url) {
                    for (let i = 0; i < parsedUrls.length; i++) {
                        if (parsedUrls[i] === url) {
                            if (i > 0) {
                                parsedUrls.unshift(parsedUrls.splice(i, 1)[0]!);
                            }
                            setJungleUrls(parsedUrls);
                            setAtOwnJungle(true);
                            i = parsedUrls.length;
                        }
                    }
                }
            } finally {
                setLoading(false);
            }
        }

        void fetchStash();
    }, [apiUrl, url]);

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
                <ul>
                    {
                        jungleUrls.map((jungleUrl, i) => <li>{jungleUrl} { atOwnJungle && i === 0 ? "<-- you're here right now!" : null }</li>)
                    }
                </ul>
                <p>Seeds: {seedCount}</p>
                {plantError && <FormError message={plantError} />}
                { 
                    planting
                    ? <button className="border border-black">Planting a jungle...</button>
                    : seedCount > 0 
                        ? <button className="border border-black" onClick={(e) => plantJungle(e)}>Plant a jungle here!</button>
                        : null
                }
            </div>
        </div>
    )
}