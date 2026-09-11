import { Router } from 'express';
import { getDb } from '../services/database';
import { StorageService } from '../services/storage';

export function createToolsRoutes(config: import('../config').EnvConfig) {
  const router = Router();
  const db = getDb(config);
  const storage = new StorageService(db);

  router.get('/trending', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const tools = storage.getTrendingTools(limit);
    res.json(tools);
  });

  return router;
}
