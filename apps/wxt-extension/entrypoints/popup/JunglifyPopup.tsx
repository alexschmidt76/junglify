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
    const [popupError, setPopupError] = useState<null | string>(null);
    const [refreshToggle, setRefreshToggle] = useState(false);

    const apiUrl = import.meta.env.WXT_API_URL;
    if (!apiUrl) throw new Error('WXT_API_URL env var must not be empty');

    const plantJungle = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();

        if (!url) {
            setPlantError("There's something wrong with this URL, try refreshing.");
            return;
        }

        setPlantError(null);

        setPlanting(true);

        try {
            const { bearerToken } = await browser.storage.local.get('bearerToken');

            const response = await fetch(apiUrl + '/jungles/create/user', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${bearerToken ?? ''}`
                },
                body: JSON.stringify({
                    url: url
                })
            });

            const { error, newSeedCount }: { error?: string, newSeedCount?: number } = await response.json();

            if (!error) {
                setJungleUrls([url, ...jungleUrls]);
                if (newSeedCount) setSeedCount(newSeedCount);
                setAtOwnJungle(true);
            } else {
                setPlantError(error);
                if (response.status === 422) setSeedCount(0);
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

        async function fetchPopupInfo() {
            setLoading(true);

            try {
                const { bearerToken } = await browser.storage.local.get('bearerToken');

                const res = await fetch(apiUrl + '/users/popup-info', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${bearerToken ?? ''}`
                    }
                });

                const data: { stash: StashInfo, jungleUrls: string[], error: string } = await res.json();
                
                if (data.error) {
                    setPopupError(data.error);
                } else {
                    setStash(data.stash);
    
                    const urls = data.jungleUrls;
    
                    if (url !== null) {
                        for (let i = 0; i < urls.length; i++) {
                            //const u = urls[i];
                            if (urls[i] === url) {
                                if (i > 0) {
                                    urls.unshift(urls.splice(i, 1)[0]!);
                                }
                                setJungleUrls(urls);
                                setAtOwnJungle(true);
                                i = urls.length;
                            }
                        }
                    }
                }
            } catch (error) {
                console.log(error)
                setPopupError("Internal server error")
            } finally {
                setLoading(false);
            }
        }

        void fetchPopupInfo();
    }, [apiUrl, url, refreshToggle]);

    if (loading) return <div>Loading...</div>;

    if (popupError) return (
        <div>
            <div>{popupError}</div>
            <button onClick={(e) => { e.preventDefault(); setRefreshToggle(!refreshToggle); }}>Refresh</button>
        </div>
    )

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