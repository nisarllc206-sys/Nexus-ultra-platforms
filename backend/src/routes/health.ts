import { Router } from 'express';

const router = Router();

/**
 * GET /health
 * Returns service liveness and basic metadata.
 */
router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'nexus-ultra-backend',
    version: process.env.npm_package_version ?? '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

export default router;
