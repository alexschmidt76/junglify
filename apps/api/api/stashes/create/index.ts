import { applyCors } from "@/lib/utils/cors.js";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { createStash } from "@/lib/services/stash.services.js";
import toHeaders from "@/lib/utils/toHeaders.js";
import auth from "@/lib/auth/auth.js";

export default async function handlers(req: VercelRequest, res: VercelResponse): Promise<void> {
    if (applyCors(req, res)) return;

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const session = await auth.api.getSession({ headers: toHeaders(req) });

    if (!session) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { url } = req.body as { url?: string, userId?: string };
    
    if (!url) {
        res.status(400).json({ error: 'A URL is required to hide a stash' });
        return;
    }

    try {
        const stashCreated = await createStash(url, session.user.id);

        if (stashCreated) {
            res.status(201).json({
                message: `New stash successfully hidden at https:/---
                          lol why would i put the url in here? It's supposed to be hidden!`
            });
            return;
        }

        res.status(500).json({
            error: 'An internal server error has occured. Make sure this url is a jungle you own.'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}