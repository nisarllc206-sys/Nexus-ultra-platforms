import { Request, Response, NextFunction } from 'express';

/**
 * Middleware that enforces API key authentication via the X-API-Key header.
 * The key is read from the API_KEY environment variable on each request so
 * that tests can override it without module reload.
 * Attach to any route that should be protected.
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const expectedKey = process.env.API_KEY ?? 'changeme';
  const key = req.headers['x-api-key'];
  if (!key || key !== expectedKey) {
    res.status(401).json({ error: 'Unauthorized: invalid or missing X-API-Key header' });
    return;
  }
  next();
}
