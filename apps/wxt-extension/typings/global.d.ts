export type UrlCache = {
    [key: string]: {
        expires: number | null,
        data: {
            isJungle: boolean,
            jungle: {
                growthStage: number,
                hasStash: boolean
            } | null,
        }
    }
}

export type UrlCacheItem = {
    expires: number | null,
    data: {
        isJungle: boolean,
        jungle: {
            growthStage: number,
            hasStash: boolean
        } | null,
    }
}

export type Cache = {
    [key: string]: {
        expires: number | null,
        data: object,
    }
}

export type Stash = {
    url: string,
    banana_count: number
}