import sql from "../db/sql.js";

export const getStashInfo = async (userId: string) => {
    const [stash] = await sql`
        SELECT j.url, s.banana_count
        FROM stashes s
        JOIN jungles j ON j.id = s.jungle_id
        WHERE s.user_id = ${userId};
    `;

    return stash;
}
