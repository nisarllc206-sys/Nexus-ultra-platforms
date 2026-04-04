import { Router, Request, Response } from 'express';
import { requireApiKey } from '../middleware/apiKey';
import { IStore } from '../persistence/IStore';
import { AgentRunner } from 'nexus-ultra-agents/src/runner';
import { registry } from 'nexus-ultra-agents/src/registry';

export function agentRouter(store: IStore): Router {
  const router = Router();
  const runner = new AgentRunner(registry);

  /**
   * POST /agent/run
   * Trigger an agent run. Requires X-API-Key header.
   *
   * Body: { agent: string, input: object }
   */
  router.post('/run', requireApiKey, async (req: Request, res: Response) => {
    const { agent, input } = req.body as { agent?: unknown; input?: unknown };

    if (typeof agent !== 'string' || !agent.trim()) {
      res.status(400).json({ error: 'Field "agent" is required and must be a non-empty string' });
      return;
    }
    if (typeof input !== 'object' || input === null) {
      res.status(400).json({ error: 'Field "input" is required and must be an object' });
      return;
    }

    // Enrich input with stored events and feedback when running FeatureSuggestionAgent
    const enriched = { ...(input as Record<string, unknown>) };
    if (!enriched.events) {
      enriched.events = await store.getEvents();
    }
    if (!enriched.feedback) {
      enriched.feedback = await store.getFeedback();
    }

    try {
      const result = await runner.run(agent, enriched);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(400).json({ error: message });
    }
  });

  return router;
}
