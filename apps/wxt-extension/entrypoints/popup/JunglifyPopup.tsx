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

    const buttonClass =
        "mt-2 w-full rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-green-500 hover:cursor-pointer disabled:opacity-60 disabled:hover:bg-green-600 disabled:hover:cursor-default";

    if (loading) return (
        <div className="flex w-80 items-center justify-center bg-green-950 p-8 text-sm font-semibold text-green-400">
            <span className="animate-pulse">Loading your jungle...</span>
        </div>
    );

    if (popupError) return (
        <div className="flex w-80 flex-col items-center gap-1 bg-green-950 p-6 text-center">
            <p className="text-sm font-semibold text-red-500">{popupError}</p>
            <button
                className={buttonClass}
                onClick={(e) => { e.preventDefault(); setRefreshToggle(!refreshToggle); }}
            >
                Refresh
            </button>
        </div>
    )

    return (
        <div className="flex w-80 flex-col gap-3 bg-green-950 p-4 text-amber-50">
            <h1 className="text-center text-xl font-extrabold tracking-wide text-green-400">Junglify</h1>

            {/* Stash */}
            <section className="rounded-xl border border-amber-900/50 bg-amber-950/40 p-3">
                <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-green-400">Your Stash</h2>
                {
                    stash ? (
                        <div className="space-y-1 text-sm">
                            <p className="truncate" title={stash.url}>
                                <span className="text-amber-200/60">URL: </span>{stash.url}
                            </p>
                            <p className="font-semibold">
                                <span className="text-amber-200/60">Bananas: </span>
                                <span className="text-yellow-400">🍌 {stash.banana_count}</span>
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs leading-relaxed text-amber-100/80">
                                You don't have a stash yet! Go to one of your jungles and hide your stash to start collecting bananas.
                            </p>
                            { hideError && <FormError message={hideError} /> }
                            {
                                atOwnJungle 
                                    ? hiding
                                        ? <button className={buttonClass} disabled>Hiding your stash...</button>
                                        : <button className={buttonClass} onClick={(e) => hideStash(e)}>Hide your stash here!</button>
                                    : null
                            }
                        </div>
                    )
                }
            </section>

            {/* Jungles */}
            <section className="rounded-xl border border-amber-900/50 bg-amber-950/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wide text-green-400">Your Jungles</h2>
                    <span className="text-xs font-semibold text-lime-400">🌱 {seedCount} seeds</span>
                </div>
                {
                    jungleUrls.length > 0 ? (
                        <ul className="flex max-h-34 flex-col gap-1 overflow-y-auto pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-amber-800/60 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
                            {
                                jungleUrls.map((jungleUrl, i) => (
                                    <li key={jungleUrl} className="flex items-center gap-1.5 rounded-md bg-green-900/40 px-2 py-1">
                                        <span className="min-w-0 truncate text-xs text-amber-50/90" title={jungleUrl}>{jungleUrl}</span>
                                        {
                                            atOwnJungle && i === 0 &&
                                            <span className="ml-auto shrink-0 rounded-full bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-black">you're here</span>
                                        }
                                    </li>
                                ))
                            }
                        </ul>
                    ) : (
                        <p className="text-xs text-amber-100/70">No jungles yet — plant one to get started!</p>
                    )
                }
                {plantError && <FormError message={plantError} />}
                {
                    planting
                        ? <button className={buttonClass} disabled>Planting a jungle...</button>
                        : seedCount > 0 &&
                            <button className={buttonClass} onClick={(e) => plantJungle(e)}>Plant a jungle here!</button>
                }
            </section>
        </div>
    )
}
