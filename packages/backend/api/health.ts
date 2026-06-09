import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors/cors.js';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  res.json({ status: 'ok' });
}
