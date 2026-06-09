import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../../lib/utils/cors.js';
import { getByIdOrUrl } from '../../../lib/services/jungle.service.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const id = req.query.id as string;
  try {
    const jungle = await getByIdOrUrl(id, null);
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
