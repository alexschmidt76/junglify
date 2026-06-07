import sql from '../db/db.connection.js';

import { JungleType } from '../typings/jungleSchemea.js';
import UUID from '../typings/uuid.js';

export const create = async (planted_by_user_id: UUID, url: string, jungle_type: JungleType) => {
    const [jungle] = await sql`
        INSERT INTO jungles (planted_by_user_id, url, jungle_type)
        VALUES (${planted_by_user_id}, ${url}, ${jungle_type})
        RETURNING *
    `;
    return jungle;
};

export const getByIdOrUrl = async (id: UUID | null, url: string | null) => {
    
}

export const update = async (id: string, data: any) => {
    // Implementation for updating a jungle
}

export const deforrest = async (id: string) => {
    // Implementation for deleting a jungle
}