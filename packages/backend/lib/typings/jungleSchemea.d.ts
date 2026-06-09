import UUID from "./uuid.js";

export type JungleType = 'owned' | 'wild';

type JungleSchema = {
    id?: UUID,
    planted_by_user_id?: string,
    url: string,
    jungle_type?: JungleType,
    planted_at?: Date,
    last_visited_at?: Date,
    growth_stage?: number
}

export default JungleSchema;