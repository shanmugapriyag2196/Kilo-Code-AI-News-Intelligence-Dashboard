import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { loadConfig } from './config';
import { getDb } from './services/database';
import { initNewsRoutes, refreshNews } from './routes/news';
import { createToolsRoutes } from './routes/tools';
import { createTrendsRoutes } from './routes/trends';
import { createStatsRoutes } from './routes/stats';
import { createSavedRoutes } from './routes/saved';
import { createRefreshRoutes } from './routes/refresh';
import { startScheduler } from './services/scheduler';
import { AIService } from './services/ai';

const config = loadConfig();

const app = express();
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  try {
    getDb(config);
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'error', error: 'Database unavailable' });
  }
});

const newsRoutes = initNewsRoutes(config);
app.use('/api/news', newsRoutes);

app.use('/api/tools', createToolsRoutes(config));
app.use('/api/trends', createTrendsRoutes(config));
app.use('/api/stats', createStatsRoutes(config));
app.use('/api/saved', createSavedRoutes(config));

const refreshRoutes = createRefreshRoutes(() => refreshNews(config));
app.use('/api/refresh', refreshRoutes);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  const ai = new AIService({ baseUrl: config.groqBaseUrl, apiKey: config.groqApiKey, model: config.groqModel });
  console.log(`AI Service available: ${ai.isAvailable()}`);
  startScheduler(config, () => refreshNews(config));
});
