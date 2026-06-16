import sql from '../db/sql.js';

export const getPopupInfo = async (userId: string) => {
    const [stash] = await sql`
        SELECT j.url, s.banana_count
        FROM stashes s
        JOIN jungles j ON j.id = s.jungle_id
        WHERE s.user_id = ${userId};
    `;
    
    const jungles: [{ url: string }] = await sql`
        SELECT url
        FROM jungles
        WHERE owner_user_id = ${userId};
    `;

    const jungleUrls = jungles.map((j) => j.url);
    
    return { stash, jungleUrls };
}