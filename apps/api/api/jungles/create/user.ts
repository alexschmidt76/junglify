import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../../lib/utils/cors.js';
import { createUserJungle } from '../../../lib/services/jungle.services.js';
import auth from '@/lib/auth/auth.js';
import toHeaders from '@/lib/utils/toHeaders.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { url } = req.body as { url?: string };
  console.log('[Junglify] Creating a jungle at url:' + url);

  if (!url) {
    res.status(400).json({ error: 'url must be a string and must not be null' });
    return;
  }

  const session = await auth.api.getSession({ headers: toHeaders(req) });

  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const result = await createUserJungle(url, session.user.id);

  if (result.error) {
    if (result.error === 422) res.status(422).json({ error: "You don't have enough seeds!" });
    else res.status(500).json({ error: 'Internal server error' });
  }

  else res.status(201).json({ newSeedCount: result.newSeedCount });
}
