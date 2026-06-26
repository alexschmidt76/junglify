export type Cache<T = object> = {
    [key: string]: {
        expires: number | null,
        data: T,
    }
}

type UrlCacheData = {
    isJungle: boolean,
    jungle: {
        growthStage: number,
        hasStash: boolean,
    } | null,
}

export type Stash = {
    url: string,
    banana_count: number
}