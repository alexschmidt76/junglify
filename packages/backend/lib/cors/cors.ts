import type { IncomingMessage, ServerResponse } from 'node:http';

const extensionOrigin = process.env.EXTENSION_ID
  ? `chrome-extension://${process.env.EXTENSION_ID}`
  : null;

export function applyCors(req: IncomingMessage, res: ServerResponse): boolean {
  const origin = req.headers.origin ?? '';
  if (extensionOrigin && origin === extensionOrigin) {
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
