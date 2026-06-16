/**
 * Custom dev server — bypasses vercel dev, runs the API locally with tsx
 * Usage (from apps/api dir): npx tsx dev-server.ts
 *   or from root: node node_modules/.bin/tsx apps/api/dev-server.ts
 */

import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '.env') });

// ---- Vercel shim types ----
type VercelRequest = IncomingMessage & {
  body: unknown;
  query: Record<string, string>;
};
type VercelResponse = ServerResponse & {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => void;
  send: (data: unknown) => void;
};

function shimResponse(res: ServerResponse): VercelResponse {
  const vres = res as VercelResponse;
  vres.status = (code: number) => {
    vres.statusCode = code;
    return vres;
  };
  vres.json = (data: unknown) => {
    vres.setHeader('Content-Type', 'application/json');
    vres.end(JSON.stringify(data));
  };
  vres.send = (data: unknown) => {
    if (typeof data === 'string') {
      vres.end(data);
    } else {
      vres.json(data);
    }
  };
  return vres;
}

async function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => {
      if (!body) { resolve(undefined); return; }
      try { resolve(JSON.parse(body)); }
      catch { resolve(body); }
    });
  });
}

function shimRequest(req: IncomingMessage, body: unknown, query: Record<string, string>): VercelRequest {
  const vreq = req as VercelRequest;
  vreq.body = body;
  vreq.query = query;
  return vreq;
}

const PORT = 3002;

async function main() {
  // Dynamic imports happen after env vars are loaded
  const { toNodeHandler } = await import('better-auth/node');
  const { default: auth } = await import('./lib/auth/auth.js');
  const { default: healthHandler } = await import('./api/health.js');
  const { default: createJungleHandler } = await import('./api/jungles/create/user.js');
  const { default: myStashHandler } = await import('./api/stashes/my-stash.js');

  const authHandler = toNodeHandler(auth);

  const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const urlObj = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    const pathname = urlObj.pathname;
    const query = Object.fromEntries(urlObj.searchParams.entries());

    console.log(`${req.method} ${pathname}`);

    // Global CORS
    const origin = req.headers.origin ?? '';
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    try {
      // Auth: /auth/* → rewrite to /api/auth/* for better-auth's handler
      if (pathname.startsWith('/auth/')) {
        req.url = req.url!.replace('/auth/', '/api/auth/');
        await authHandler(req, res);
        return;
      }
      // Auth: /api/auth/* → pass through directly
      if (pathname.startsWith('/api/auth/')) {
        await authHandler(req, res);
        return;
      }

      const body = await parseBody(req);
      const vreq = shimRequest(req, body, query);
      const vres = shimResponse(res);

      if (pathname === '/health' || pathname === '/api/health') {
        healthHandler(vreq, vres);
        return;
      }

      if (pathname === '/jungles/create' || pathname === '/api/jungles/create') {
        await createJungleHandler(vreq, vres);
        return;
      }

      if (pathname === '/stashes/my-stash' || pathname === '/api/stashes/my-stash') {
        await myStashHandler(vreq, vres);
        return;
      }

      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Not found', path: pathname }));
    } catch (err) {
      console.error('Request error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    }
  });

  server.listen(PORT, () => {
    process.stderr.write(`\n✅ Junglify API running at http://localhost:${PORT}\n`);
    process.stderr.write('Routes: /health  /auth/*  /jungles/create  /stashes/my-stash\n\n');
  });
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
