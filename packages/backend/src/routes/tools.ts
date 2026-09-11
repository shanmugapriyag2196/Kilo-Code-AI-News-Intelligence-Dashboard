import { Router } from 'express';
import { getAirtable } from '../services/database';
import { StorageService } from '../services/storage';
import { asyncHandler } from '../middleware/asyncHandler';

export function createToolsRoutes(config: import('../config').EnvConfig) {
  const router = Router();
  const storage = new StorageService(getAirtable(config), config);

  router.get('/trending', asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const tools = await storage.getTrendingTools(limit);
    res.json(tools);
  }));

  return router;
}
