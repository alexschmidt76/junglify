import auth from "@/lib/auth/auth.js";
import { getPopupInfo } from "@/lib/services/user.service.js";
import { applyCors } from "@/lib/utils/cors.js";
import toHeaders from "@/lib/utils/toHeaders.js";
import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
    if (applyCors(req, res)) return;

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const session = await auth.api.getSession({ headers: toHeaders(req) });

    if (!session) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { stash, jungleUrls } = await getPopupInfo(session.user.id);

    res.json({ stash, jungleUrls });
}