import sql from "../db/sql.js";

export const createStash = async (url: string, userId: string): Promise<boolean> => {
    const result: { count: number } = await sql`
        INSERT INTO stashes (user_id, jungl_id)
        SELECT ${userId}, j.id
        FROM jungles j
        WHERE j.url = ${url}
    `;

    return result.count === 1;
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
