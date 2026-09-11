import { Router, Request, Response } from 'express';

export function createRefreshRoutes(
  refreshFn: () => Promise<{ success: boolean; articlesFetched: number; articlesNew: number; articlesDuplicated: number; error: string | null; timestamp: string }>
) {
  const router = Router();

  router.post('/', async (_req: Request, res: Response) => {
    try {
      const result = await refreshFn();
      res.json({ status: 'refresh_complete', ...result });
    } catch (err) {
      console.error('Manual refresh error:', err);
      res.status(500).json({
        status: 'refresh_error',
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
}
