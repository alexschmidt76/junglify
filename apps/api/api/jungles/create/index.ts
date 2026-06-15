import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '@/lib/utils/cors.js';
import { createJungle } from '@/lib/services/jungle.services.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { url, userId } = req.body as { url?: string; userId?: string };

  if (!url) {
    res.status(400).json({ error: 'URL is required to create a jungle' });
    return;
  }

  try {
    const jungle = await createJungle(url, userId ?? null);
    res.status(201).json(jungle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
