import { toNextJsHandler } from 'better-auth/next-js';
import auth from '../../lib/auth/auth.js';
import getTrustedOrigins from '../../lib/utils/trustedOrigins.js';

const trustedOrigins = getTrustedOrigins();
const handlers = toNextJsHandler(auth);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  if (!trustedOrigins.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

function withCors(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const res = await handler(req);
    for (const [key, value] of Object.entries(corsHeaders(req))) {
      res.headers.set(key, value);
    }
    return res;
  };
}

export const GET = withCors(handlers.GET);
export const POST = withCors(handlers.POST);
export const OPTIONS = async (req: Request): Promise<Response> =>
  new Response(null, { status: 204, headers: corsHeaders(req) });
