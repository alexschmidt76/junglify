/**
 * Merge a single keyed entry into a named cache held in `storage.local`.
 *
 * The actual read-modify-write happens in the background (the single writer for
 * the cache) to avoid clobbering concurrent updates from other tabs; this just
 * forwards the entry over a message.
 */
const cacheUpdate = async (cacheName: string, key: string, value: object) => {
    try {
        const res = await browser.runtime.sendMessage({
            type: 'UPDATE_CACHE',
            payload: { cacheName, key, value },
        });

        return res;
    } catch (error) {
        console.warn("[Junglify] cache update sendMessage failed:", error);
        return null;
    }
}

export default cacheUpdate;
