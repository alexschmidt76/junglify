import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '@/lib/utils/cors.js';
import { updateJungle } from '@/lib/services/jungle.service.js';
import type JungleSchema from '@/lib/typings/jungleSchemea.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (applyCors(req, res)) return;

  if (req.method !== 'PUT') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const id = req.query.id as string;

  if (!id) {
    res.status(400).json({ error: 'Jungle id is required for update' });
    return;
  }

  try {
    const jungle = await updateJungle(id, req.body as JungleSchema);

    if (!jungle) {
      res.status(404).json({ error: 'Jungle not found' });
      return;
    }
    
    res.json(jungle);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    res.status(message.startsWith('Invalid field') ? 400 : 500).json({ error: message });
  }
}
