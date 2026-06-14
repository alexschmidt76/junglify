import { VercelRequest } from "@vercel/node";

export default function toHeaders(req: VercelRequest): Headers {
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
        if (value === undefined) continue;
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
    
    return headers;
}