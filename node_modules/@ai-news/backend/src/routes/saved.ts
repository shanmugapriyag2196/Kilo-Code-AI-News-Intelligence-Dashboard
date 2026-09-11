import { Router, Request, Response } from 'express';
import { validateSaveToggle } from '../middleware/validation';
import { getDb } from '../services/database';
import { StorageService } from '../services/storage';

export function createSavedRoutes(config: import('../config').EnvConfig) {
  const router = Router();
  const db = getDb(config);
  const storage = new StorageService(db);

  router.get('/', (_req, res) => {
    const saved = storage.getSaved();
    res.json(saved);
  });

  router.put('/:id', validateSaveToggle, (req, res) => {
    const article = storage.toggleSave((req as any).validatedId);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  });

  router.delete('/:id', validateSaveToggle, (req, res) => {
    const deleted = storage.deleteArticle((req as any).validatedId);
    if (!deleted) return res.status(404).json({ error: 'Article not found' });
    res.status(204).send();
  });

  return router;
}
