import { Router } from 'express';
import { validateSaveToggle } from '../middleware/validation';
import { getAirtable } from '../services/database';
import { StorageService } from '../services/storage';
import { asyncHandler } from '../middleware/asyncHandler';

export function createSavedRoutes(config: import('../config').EnvConfig) {
  const router = Router();
  const storage = new StorageService(getAirtable(config), config);

  router.get('/', asyncHandler(async (_req, res) => {
    const saved = await storage.getSaved();
    res.json(saved);
  }));

  router.put('/:id', validateSaveToggle, asyncHandler(async (req, res) => {
    const article = await storage.toggleSave((req as any).validatedId);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  }));

  router.delete('/:id', validateSaveToggle, asyncHandler(async (req, res) => {
    const deleted = await storage.deleteArticle((req as any).validatedId);
    if (!deleted) return res.status(404).json({ error: 'Article not found' });
    res.status(204).send();
  }));

  return router;
}
