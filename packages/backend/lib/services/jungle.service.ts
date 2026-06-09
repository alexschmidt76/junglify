import { getSql } from '../utils/db.js';

import type JungleSchema from '../typings/jungleSchemea.d.js';

export const createJungle = async (url: string, planted_by_user_id: string | null) => {
    const sql = getSql();

    const [jungle] = await sql`
        INSERT INTO jungles (planted_by_user_id, url, jungle_type)
        VALUES (${planted_by_user_id}, ${url}, ${planted_by_user_id ? 'owned' : 'wild'})
        RETURNING *
    `;

    await sql.end();
    return jungle;
};

export const getJungleById = async (id: string) => {
    const sql = getSql();

    const [jungle] = await sql`
        SELECT * FROM jungles
        WHERE id = ${id}
    `;

    await sql.end();
    return jungle;
};

export const getJungleByUrl = async (url: string) => {
    const sql = getSql();

    const [jungle] = await sql`
        SELECT * FROM jungles
        WHERE url = ${url}
    `;

    await sql.end();
    return jungle;
};

export const updateJungle = async (id: string, updateData: JungleSchema) => {
    // check to make sure no update data is malicious
    for (const key in Object.keys(updateData)) {
        if (!['owner', 'jungle_type', 'last_visited_at', 'growth_stage'].includes(key)) {
            throw new Error(`Invalid field in update data: ${key}`);
        }
    }

    const sql = getSql();

    const [updatedJungle] = await sql`
        UPDATE jungles
        SET ${sql(updateData)}
        WHERE id = ${id}
        RETURNING *
    `;

    await sql.end();
    return updatedJungle;
}

export const deleteJungle = async (id: string) => {
    const sql = getSql();

    const [deletedJungle] = await sql`
        DELETE FROM jungles
        WHERE id = ${id}
        RETURNING *
    `;

    await sql.end();
    return deletedJungle;
}