import express from 'express';
import { config } from './config';
import { createStore } from './persistence/factory';
import healthRouter from './routes/health';
import { eventsRouter } from './routes/events';
import { feedbackRouter } from './routes/feedback';
import { agentRouter } from './routes/agent';

export function createApp() {
  const app = express();
  const store = createStore();

  app.use(express.json());

  app.use('/health', healthRouter);
  app.use('/events', eventsRouter(store));
  app.use('/feedback', feedbackRouter(store));
  app.use('/agent', agentRouter(store));

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}

// Only start the server when this file is run directly (not imported in tests)
if (require.main === module) {
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[nexus-ultra-backend] Listening on http://localhost:${config.port}`);
    console.log(`[nexus-ultra-backend] Store adapter: ${config.storeAdapter}`);
  });
}
