import sql from "../db/sql.js";

export const createStash = async (url: string, userId: string): Promise<boolean> => {
    const result: { count: number } = await sql`
        INSERT INTO stashes (user_id, jungle_id)
        SELECT ${userId}, j.id
        FROM jungles j
        WHERE j.url = ${url} AND j.owner_user_id = ${userId};
    `;

    return result.count === 1;
}

export const addBananaDelta = async (delta: number, userId: string): Promise<number> => {
    const [row] = await sql`
        UPDATE stashes
        SET banana_count = GREATEST(0, banana_count + ${delta})
        WHERE user_id = ${userId}
        RETURNING banana_count;
    `;

    return row ? row.banana_count : -1;
}

export const getStashInfo = async (userId: string) => {
    const [stash] = await sql`
        SELECT j.url, s.banana_count
        FROM stashes s
        JOIN jungles j ON j.id = s.jungle_id
        WHERE s.user_id = ${userId};
    `;

    return stash;
}
