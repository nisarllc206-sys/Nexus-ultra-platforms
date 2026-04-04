import { Router, Request, Response } from 'express';
import { IStore } from '../persistence/IStore';

export function feedbackRouter(store: IStore): Router {
  const router = Router();

  /**
   * POST /feedback
   * Ingest user feedback.
   *
   * Body: { message: string, userId?: string, rating?: number }
   */
  router.post('/', async (req: Request, res: Response) => {
    const { message, userId, rating } = req.body as {
      message?: unknown;
      userId?: unknown;
      rating?: unknown;
    };

    if (typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Field "message" is required and must be a non-empty string' });
      return;
    }
    if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
      res.status(400).json({ error: 'Field "rating" must be a number between 1 and 5' });
      return;
    }

    try {
      const saved = await store.saveFeedback({
        message,
        userId: typeof userId === 'string' ? userId : undefined,
        rating: typeof rating === 'number' ? rating : undefined,
      });
      res.status(201).json(saved);
    } catch (err) {
      res.status(500).json({ error: 'Failed to save feedback', detail: String(err) });
    }
  });

  return router;
}
