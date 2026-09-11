import { Router } from 'express';
import { getDb } from '../services/database';
import { StorageService } from '../services/storage';
export function createTrendsRoutes(config) {
    const router = Router();
    const db = getDb(config);
    const storage = new StorageService(db);
    router.get('/', (_req, res) => {
        const limit = parseInt(_req.query.limit) || 20;
        const trends = storage.getTrends(limit);
        res.json(trends);
    });
    return router;
}
//# sourceMappingURL=trends.js.map