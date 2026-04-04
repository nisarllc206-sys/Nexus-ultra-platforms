import { Router, Request, Response } from 'express';
import { IStore } from '../persistence/IStore';

export function eventsRouter(store: IStore): Router {
  const router = Router();

  /**
   * POST /events
   * Ingest a telemetry event.
   *
   * Body: { type: string, payload: object }
   */
  router.post('/', async (req: Request, res: Response) => {
    const { type, payload } = req.body as { type?: unknown; payload?: unknown };

    if (typeof type !== 'string' || !type.trim()) {
      res.status(400).json({ error: 'Field "type" is required and must be a non-empty string' });
      return;
    }
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      res.status(400).json({ error: 'Field "payload" is required and must be an object' });
      return;
    }

    try {
      const saved = await store.saveEvent({ type, payload: payload as Record<string, unknown> });
      res.status(201).json(saved);
    } catch (err) {
      res.status(500).json({ error: 'Failed to save event', detail: String(err) });
    }
  });

  return router;
}
