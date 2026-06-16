import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../../lib/utils/cors.js';
import { createJungle } from '../../../lib/services/jungle.service.js';
import auth from '@/lib/auth/auth.js';
import toHeaders from '@/lib/utils/toHeaders.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  if (!req.body.url || typeof req.body.url !== 'string') {
    res.status(400).json({ error: 'url must be a string and must not be null' });
    return;
  }

  const session = await auth.api.getSession({ headers: toHeaders(req) });

  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const jungleCreated = await createJungle(req.body.url, session.user.id);

  if (!jungleCreated) {
    res.status(500).json({ error: 'Internal server error' })
    return;
  }

  res.status(201).json({ message: 'Jungle created successfully' });
}
