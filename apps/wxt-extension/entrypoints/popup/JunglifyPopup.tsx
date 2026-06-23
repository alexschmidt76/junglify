import { useEffect, useState } from "react";
import cleanUrl from "@/utils/urlCleaner";

import type User from '@repo/utils/types/user';
import FormError from "@repo/react-components/FormError";

type StashInfo = {
    url: string,
    banana_count: number
}

type PlantResponse = {
    ok: boolean,
    status?: number,
    newSeedCount?: number,
    error?: string,
}

type HideResponse = {
    ok: boolean,
    status?: number,
    error?: string
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
    const [hiding, setHiding] = useState(false);
    const [hideError, setHideError] = useState<null | string>(null);

    const plantJungle = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();

        if (planting) return;

        if (!url) {
            setPlantError("There's something wrong with this URL, try refreshing.");
            return;
        }

        setPlantError(null);
        setPlanting(true);

        try {
            const res = await browser.runtime.sendMessage({
                type: 'PLANT_JUNGLE',
                url: url,
            }) as PlantResponse;

            if (res.error) {
                setPlantError(res.error);
                if (res.status === 422) setSeedCount(0);
            } else if (res.ok) {
                setJungleUrls([url, ...jungleUrls]);
                if (res.newSeedCount !== undefined) setSeedCount(res.newSeedCount);
                setAtOwnJungle(true);
            } else {
                setPlantError("Something went wrong planting your jungle.");
            }
        } catch (error) {
            console.log(error);
            setPlantError("Something went wrong planting your jungle.");
        } finally {
            setPlanting(false);
        }
    }

    const hideStash = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();

        if (hiding) return;

        if (!url) {
            setHideError("There's something wrong with this URL, try refreshing.");
            return;
        }

        setHideError(null);
        setHiding(true);

        try {
            const res = await browser.runtime.sendMessage({
                type: 'HIDE_STASH',
                url,
            }) as HideResponse;
            
            if (res.error) setHideError(res.error);
            else if (res.ok) setStash({ url: url, banana_count: 0 });
            else setHideError("Something went wrong hiding your stash.");
        } catch (error) {
            console.log(error);
            setHideError("Something went wrong hiding your stash.");
        } finally {
            setHiding(false);
        }
    } 

    useEffect(() => {
        if (!url) browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
            if (tab?.url) setUrl(cleanUrl(tab.url));
        });

        const getPopupInfo = async () => {
            setLoading(true);

            try {
                const { stash, jungleUrls = [] } = await browser.storage.local.get([
                    'stash',
                    'jungleUrls',
                ]) as { stash?: StashInfo, jungleUrls?: string[] };

                setStash(stash ?? null);

                // surface the jungle url for the current tab to the top of the list (if its a jungle)
                if (url && jungleUrls.includes(url)) {
                    setJungleUrls([url, ...jungleUrls.filter((u) => u !== url)]);
                    setAtOwnJungle(true);
                } else {
                    setJungleUrls(jungleUrls);
                    setAtOwnJungle(false);
                }
            } catch (error) {
                console.log(error);
                setPopupError("Couldn't load your jungle info.");
            } finally {
                setLoading(false);
            }
        }

        void getPopupInfo();

        browser.runtime.onMessage.addListener((message, _sender, sendResponse) =>{
            if (['STASH_UPDATE', 'JUNGLE_URLS_UPDATE', 'POPUP_UPDATE'].includes(message.type)) {
                getPopupInfo().then(sendResponse);
            }
        });
    }, [url, refreshToggle]);

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
                            { hideError && <FormError message={hideError} />
                             }
                            { 
                                atOwnJungle 
                                && hiding
                                    ? <button>Hiding your stash...</button>
                                    : <button onClick={(e) => hideStash(e)}>Hide your stash here!</button> 
                            }
                        </>
                    )
                }
            </div>
            <span className="h-128 w-8 mx-4 bg-black rounded-2xl" />
            <div className="flex flex-col text-2xl">
                <ul>
                    {
                        jungleUrls.map((jungleUrl, i) => <li key={jungleUrl}>{jungleUrl} { atOwnJungle && i === 0 ? "<-- you're here right now!" : null }</li>)
                    }
                </ul>
                <p>Seeds: {seedCount}</p>
                {plantError && <FormError message={plantError} />}
                {
                    planting
                    ? <button className="border border-black">Planting a jungle...</button>
                    : seedCount > 0
                        && <button className="border border-black" onClick={(e) => plantJungle(e)}>Plant a jungle here!</button>
                }
            </div>
        </div>
    )
}
