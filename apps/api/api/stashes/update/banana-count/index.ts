import auth from "@/lib/auth/auth.js";
import sql from "@/lib/db/sql.js";
import { applyCors } from "@/lib/utils/cors.js";
import toHeaders from "@/lib/utils/toHeaders.js";
import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handlers(req: VercelRequest, res: VercelResponse): Promise<void> {
    if (applyCors(req, res)) return;

    if (req.method !== 'PATCH') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const session = await auth.api.getSession({ headers: toHeaders(req) });

    if (!session) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    if (req.query.url) {
        const delta = req.body.delta;
        const url = req.query.url;
    
        if (!delta) {
            res.status(400).json({ error: 'Bad request' });
            return;
        }
    
        try {
            const [banana_count] = await sql`
                UPDATE stashes s
                SET s.banana_count = s.banana_count + ${delta}
                WHERE s.url = ${url}
                RETURNING s.banana_count;
            `;

            if (!banana_count) {
                res.status(404).json({ error: 'Stash not found' });
                return;
            }

            res.status(200).json({ banana_count });
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}