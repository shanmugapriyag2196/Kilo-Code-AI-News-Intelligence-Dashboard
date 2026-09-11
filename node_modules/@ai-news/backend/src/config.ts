export interface EnvConfig {
  port: number;
  databasePath: string;
  openaiBaseUrl: string;
  openaiApiKey: string;
  openaiModel: string;
  refreshIntervalMinutes: number;
  gdeltApiUrl: string;
  frontendUrl: string;
  nodeEnv: string;
}

export function loadConfig(): EnvConfig {
  return {
    port: parseInt(process.env.PORT || '3001', 10),
    databasePath: process.env.DATABASE_PATH || './data/news.db',
    openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    refreshIntervalMinutes: parseInt(process.env.REFRESH_INTERVAL_MINUTES || '30', 10),
    gdeltApiUrl: process.env.GDELT_API_URL || 'https://api.gdeltproject.org/api/v2/doc/doc',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}
