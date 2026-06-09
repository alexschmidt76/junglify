import type JungleSchema from '../typings/jungleSchemea.d.js';

export const createJungle = async (url: string, planted_by_user_id: string | null) => {
    const [jungle] = await sql`
        INSERT INTO jungles (planted_by_user_id, url, jungle_type)
        VALUES (${planted_by_user_id}, ${url}, ${planted_by_user_id ? 'owned' : 'wild'})
        RETURNING *
    `;
    return jungle;
};

export const getByIdOrUrl = async (id: string | null, url: string | null) => {
    if (!id && !url) throw new Error('Either id or url must be provided');
    const [jungle] = await sql`
        SELECT * FROM jungles
        WHERE id = ${id} OR url = ${url}
    `;
    return jungle;
};

export const update = async (id: string, updateData: JungleSchema) => {
    // check to make sure no update data is malicious
    for (const key in updateData) {
        if (['id', 'planted_by_user_id', 'url', 'planted_at'].includes(key)) {
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

export const deforrest = async (id: string) => {
    const [deletedJungle] = await sql`
        DELETE FROM jungles
        WHERE id = ${id}
        RETURNING *
    `;
    return deletedJungle;
}