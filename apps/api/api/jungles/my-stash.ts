import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../lib/utils/cors.js';
import auth from '../../lib/auth/auth.js';
import { getStashJungleUrlByUserId } from '@/lib/services/jungle.service.js';

function toHeaders(req: VercelRequest): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  return headers;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const session = await auth.api.getSession({ headers: toHeaders(req) });

  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const url = getStashJungleUrlByUserId(session.user.id);

  res.status(200).json({ url });
}
