import type { Request, Response, NextFunction } from 'express';

export default function errorHandler(err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) {
    console.error(err);
    const status = err.status ?? 500;
    const message = status < 500 ? err.message : 'Internal Server Error';
    res.status(status).json({ error: message });
}