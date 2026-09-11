import { Router } from 'express';
import { getAirtable } from '../services/database';
import { StorageService } from '../services/storage';
import { asyncHandler } from '../middleware/asyncHandler';

export function createTrendsRoutes(config: import('../config').EnvConfig) {
  const router = Router();
  const storage = new StorageService(getAirtable(config), config);

  router.get('/', asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const trends = await storage.getTrends(limit);
    res.json(trends);
  }));

  return router;
}
