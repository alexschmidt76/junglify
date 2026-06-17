import sql from '../db/sql.js';

import type JungleSchema from '../typings/jungleSchemea.d.js';

export const createUserJungle = async (url: string, userId: string | null) => {
    try {
        const newSeedCount = await sql.begin((async (sql) => {
            const [user] = await sql`
                UPDATE "user"
                SET seed_count = seed_count - 1
                WHERE id = ${userId} AND seed_count > 0
                RETURNING seed_count;
            `;

            if (!user) return { error: 422 }

            const { count } = await sql`
                INSERT INTO jungles (owner_user_id, planted_by_user_id, url, jungle_type)
                SELECT ${userId}, ${userId}, ${url}, 'owned';
            `;

            if (count === 0) return { error: 500 };

            return user.seed_count;
        }));

        return { newSeedCount };
    } catch (error) {
        console.log(error);
        return { error: 500 };
    }
    
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
        SELECT 
            j.growthStage,
            (s.jungle_url IS NOT NULL) AS has_stash 
        FROM jungles j
        LEFT JOIN stashes s ON s.jungle_url = ${url}
        WHERE j.url = ${url};
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
