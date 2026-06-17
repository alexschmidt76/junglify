import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../lib/utils/cors.js';
import { getJungleByUrl } from '../../lib/services/jungle.service.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
    if (applyCors(req, res)) return;

    if (req.method === 'GET') {
        if (req.query.url) {
            const url = req.query.url as string;
            
            const jungle = await getJungleByUrl(url);

            if (!jungle) {
                res.status(404).json({ error: 'Jungle not found' });
                return;
            }

            res.status(200).json({ 
                growthStage: jungle.growth_stage,
                hasStash: jungle.has_stash,
            });
        } else {
            res.status(200).json({ 
                message: "this is the junglify api /jungles endpoint, use /jungles/[id] or /jungles?url=[url] to get a specific jungle",
                monkey_noises: ['ooh ooh', 'aah aah', 'eek eek']
            });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
}