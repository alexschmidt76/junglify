const cacheUpdate = async (cacheName: string, data: object) => {
    try {
        const res = await browser.runtime.sendMessage({
            type: 'UPDATE_CACHE',
            payload: { cacheName, data },
        });

        return res;
    } catch (error) {
        console.warn("[Junglify] cache update sendMessage failed:", error);
        return null;
    }
}

export default cacheUpdate;