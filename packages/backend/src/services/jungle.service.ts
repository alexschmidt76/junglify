import sql from '../db/db.connection.js';

import type JungleSchema from '../typings/jungleSchemea.js';
import type UUID from '../typings/uuid.js';

export const create = async (url: string, planted_by_user_id: UUID | null) => {
    const [jungle] = await sql`
        INSERT INTO jungles (planted_by_user_id, url, jungle_type)
        VALUES (${planted_by_user_id}, ${url}, ${planted_by_user_id ? 'owned' : 'wild'})
        RETURNING *
    `;
    return jungle;
};

export const getByIdOrUrl = async (id: UUID | null, url: string | null) => {
    if (!id && !url) throw new Error('Either id or url must be provided');
    const [jungle] = await sql`
        SELECT * FROM jungles
        WHERE id = ${id} OR url = ${url}
    `;
    return jungle;
};

export const update = async (jungleData: JungleSchema) => {
    const { id, ...updateData } = jungleData;
    if (!id) throw new Error('Jungle id is required for update');
    const [updatedJungle] = await sql`
        UPDATE jungles
        SET ${sql(updateData)}
        WHERE id = ${id}
        RETURNING *
    `;
    return updatedJungle;
}

export const deforrest = async (id: UUID) => {
    const [deletedJungle] = await sql`
        DELETE FROM jungles
        WHERE id = ${id}
        RETURNING *
    `;
    return deletedJungle;
}