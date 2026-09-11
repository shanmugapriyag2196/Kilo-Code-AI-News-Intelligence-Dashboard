import { Router } from 'express';
import { getDb } from '../services/database';
import { StorageService } from '../services/storage';
import { AIService } from '../services/ai';

export function createStatsRoutes(config: import('../config').EnvConfig) {
  const router = Router();
  const db = getDb(config);
  const storage = new StorageService(db);

  router.get('/', (_req, res) => {
    const stats = storage.getStats({
      refreshIntervalMinutes: config.refreshIntervalMinutes,
      sourceAdapter: 'GDELT DOC API',
    });
    const ai = new AIService({ baseUrl: config.groqBaseUrl, apiKey: config.groqApiKey, model: config.groqModel });
    stats.aiAvailable = ai.isAvailable();
    res.json(stats);
  });

  return router;
}
