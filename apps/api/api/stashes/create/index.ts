import { applyCors } from "@/lib/utils/cors.js";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { createStash } from "@/lib/services/stash.services.js";

export default async function handlers(req: VercelRequest, res: VercelResponse): Promise<void> {
    if (applyCors(req, res)) return;

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { url, userId } = req.body as { url?: string, userId?: string };
    
    if (!url) {
        res.status(400).json({ error: 'A URL is required to hide a stash' });
        return;
    }

    if (!userId) {
        res.status(400).json({ error: 'A user ID is required to hide a stash' });
        return;
    }

    const stashCreated = await createStash(url, userId);

    if (stashCreated) res.status(200).json({ message: `New stash successfully hidden at https:/--- lol why would i put the url in here it's supposed to be hidden!` });

    res.status(500).json({ error: 'An internal server error has occured. Make sure this url is a jungle you own!' });
}