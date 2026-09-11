import { Router } from 'express';
import { validateSaveToggle } from '../middleware/validation';
import { getDb } from '../services/database';
import { StorageService } from '../services/storage';
export function createSavedRoutes(config) {
    const router = Router();
    const db = getDb(config);
    const storage = new StorageService(db);
    router.get('/', (_req, res) => {
        const saved = storage.getSaved();
        res.json(saved);
    });
    router.put('/:id', validateSaveToggle, (req, res) => {
        const article = storage.toggleSave(req.validatedId);
        if (!article)
            return res.status(404).json({ error: 'Article not found' });
        res.json(article);
    });
    router.delete('/:id', validateSaveToggle, (req, res) => {
        const deleted = storage.deleteArticle(req.validatedId);
        if (!deleted)
            return res.status(404).json({ error: 'Article not found' });
        res.status(204).send();
    });
    return router;
}
//# sourceMappingURL=saved.js.map