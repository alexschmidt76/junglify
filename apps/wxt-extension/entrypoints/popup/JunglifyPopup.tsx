import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";

type StashInfo = {
    url: string,
    banana_count: number
}

export default function JunglifyPopup({ store }: { store: ReturnType<typeof useStore> }) {
    const [stash, setStash] = useState<null | StashInfo>(null);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        const apiUrl = import.meta.env.WXT_API_URL;
        if (!apiUrl) throw new Error('WXT_API_URL env var must not be empty');

        
        async function fetchStash() {
            setLoading(true);

            try {
                const { bearerToken } = await browser.storage.local.get('bearerToken');

                const res = await fetch(apiUrl + '/stashes/my-stash', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${bearerToken ?? ''}`,
                    },
                });

                if (!res.ok) return;

                const data: StashInfo = await res.json();
                setStash(data);
            } finally {
                setLoading(false);
            }
        }

        void fetchStash();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="flex">
            {
                stash ? (
                    <div>
                        <p>Stash URL: {stash.url}</p>
                        <p>Bananas: {stash.banana_count}</p>
                    </div>    
                ) : (
                    <div>
                        <p>You don't have a stash yet!</p>
                        <p>Go to one of your jungles and hide your stash to start collecting bananas.</p>
                    </div>
                )
            }
        </div>
    )
}