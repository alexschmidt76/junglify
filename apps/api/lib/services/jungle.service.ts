import sql from '../db/sql.js';

import type JungleSchema from '../typings/jungleSchemea.d.js';

export const createJungle = async (url: string, planted_by_user_id: string | null) => {
    const [jungle] = await sql`
        INSERT INTO jungles (planted_by_user_id, url, jungle_type)
        VALUES (${planted_by_user_id}, ${url}, ${planted_by_user_id ? 'owned' : 'wild'})
        RETURNING *
    `;

    return jungle;
};

export const getJungleById = async (id: string) => {
    const [jungle] = await sql`
        SELECT * FROM jungles
        WHERE id = ${id}
    `;

    return jungle;
};

export const getJungleByUrl = async (url: string) => {
    const [jungle] = await sql`
        SELECT * FROM jungles
        WHERE url = ${url}
    `;

    return jungle;
};

export const updateJungle = async (id: string, updateData: JungleSchema) => {
    // check to make sure no update data is malicious
    for (const key of Object.keys(updateData)) {
        if (!['owner', 'jungle_type', 'last_visited_at', 'growth_stage'].includes(key)) {
            throw new Error(`Invalid field in update data: ${key}`);
        }
    }

    const [updatedJungle] = await sql`
        UPDATE jungles
        SET ${sql(updateData)}
        WHERE id = ${id}
        RETURNING *
    `;

    return updatedJungle;
}

export const deleteJungle = async (id: string) => {
    const [deletedJungle] = await sql`
        DELETE FROM jungles
        WHERE id = ${id}
        RETURNING *
    `;

    return deletedJungle;
}

export const getStashJungleUrlByUserId = async (userId: string) => {
    const [url] = await sql`
        SELECT j.url
        FROM stashes s
        JOIN jungles j ON j.id = s.jungle_id
        WHERE s.user_id = ${userId}
    `;

    return url;
}