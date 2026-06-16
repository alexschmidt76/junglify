import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'node:http';

vi.mock('@/lib/utils/trustedOrigins.js', () => ({
  default: () => ['https://trusted.com'],
}));

import { applyCors } from '@/lib/utils/cors.js';

function makeReq(method: string, origin?: string): IncomingMessage {
  return {
    method,
    headers: origin !== undefined ? { origin } : {},
  } as unknown as IncomingMessage;
}

function makeRes() {
  const res = {
    statusCode: 200,
    setHeader: vi.fn(),
    end: vi.fn(),
  };
  return res as unknown as ServerResponse & { statusCode: number };
}

describe('applyCors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets CORS headers for a trusted origin', () => {
    const req = makeReq('GET', 'https://trusted.com');
    const res = makeRes();
    applyCors(req, res);
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://trusted.com');
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
  });

  it('does not set CORS headers for an untrusted origin', () => {
    const req = makeReq('GET', 'https://evil.com');
    const res = makeRes();
    applyCors(req, res);
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it('does not set CORS headers when no origin header is present', () => {
    const req = makeReq('GET');
    const res = makeRes();
    applyCors(req, res);
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it('returns false for non-OPTIONS requests', () => {
    const req = makeReq('GET', 'https://trusted.com');
    const res = makeRes();
    expect(applyCors(req, res)).toBe(false);
  });

  it('returns true and sends 204 for OPTIONS from a trusted origin', () => {
    const req = makeReq('OPTIONS', 'https://trusted.com');
    const res = makeRes();
    const result = applyCors(req, res);
    expect(result).toBe(true);
    expect(res.statusCode).toBe(204);
    expect(res.end).toHaveBeenCalled();
  });

  it('returns true and sends 204 for OPTIONS from an untrusted origin', () => {
    const req = makeReq('OPTIONS', 'https://evil.com');
    const res = makeRes();
    const result = applyCors(req, res);
    expect(result).toBe(true);
    expect(res.statusCode).toBe(204);
    expect(res.end).toHaveBeenCalled();
  });

  it('sets CORS headers before handling OPTIONS', () => {
    const req = makeReq('OPTIONS', 'https://trusted.com');
    const res = makeRes();
    applyCors(req, res);
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://trusted.com');
  });
});
