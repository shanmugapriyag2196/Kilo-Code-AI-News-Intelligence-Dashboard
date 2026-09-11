import { Router } from 'express';
import { getAirtable } from '../services/database';
import { StorageService } from '../services/storage';
import { AIService } from '../services/ai';
import { asyncHandler } from '../middleware/asyncHandler';

export function createStatsRoutes(config: import('../config').EnvConfig) {
  const router = Router();
  const storage = new StorageService(getAirtable(config), config);

  router.get('/', asyncHandler(async (_req, res) => {
    const stats = await storage.getStats({
      refreshIntervalMinutes: config.refreshIntervalMinutes,
      sourceAdapter: 'GDELT DOC API',
    });
    const ai = new AIService({ baseUrl: config.groqBaseUrl, apiKey: config.groqApiKey, model: config.groqModel });
    stats.aiAvailable = ai.isAvailable();
    res.json(stats);
  }));

  return router;
}
