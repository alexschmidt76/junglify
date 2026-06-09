import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../../src/lib/cors.js';
import { create } from '../../../src/services/jungle.service.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const { url, planted_by_user_id } = req.body as { url?: string; planted_by_user_id?: string };
  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }
  try {
    const jungle = await create(url, planted_by_user_id ?? null);
    res.status(201).json(jungle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
