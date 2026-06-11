import type { IncomingMessage, ServerResponse } from 'node:http';
import getTrustedOrigins from './trustedOrigins.js';

const trustedOrigins = getTrustedOrigins();

export function applyCors(req: IncomingMessage, res: ServerResponse): boolean {
  const origin = req.headers.origin ?? '';

  if (trustedOrigins.length && trustedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
  res.statusCode = 204;
  res.end();
  return true;
  }

  return false;
}
