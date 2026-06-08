import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../../lib/cors.js';
import { getByIdOrUrl } from '../../../services/jungle.service.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const url = req.query.url as string;
  try {
    const jungle = await getByIdOrUrl(null, url);
    if (!jungle) {
      res.status(404).json({ error: 'Jungle not found' });
      return;
    }
    res.json(jungle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
