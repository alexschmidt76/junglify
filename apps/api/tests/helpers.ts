import { vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export function makeReq(overrides: Record<string, unknown> = {}): VercelRequest {
  return {
    method: 'GET',
    headers: {},
    query: {},
    body: null,
    ...overrides,
  } as unknown as VercelRequest;
}

export function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status: vi.fn(),
    json: vi.fn(),
    end: vi.fn(),
    setHeader: vi.fn(),
  };
  res.status.mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json.mockImplementation((data: unknown) => {
    res.body = data;
    return res;
  });
  return res as typeof res & { _asVercelResponse: VercelResponse };
}

export type MockRes = ReturnType<typeof makeRes>;
