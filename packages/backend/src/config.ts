export interface EnvConfig {
  port: number;
  databasePath: string;
  groqBaseUrl: string;
  groqApiKey: string;
  groqModel: string;
  refreshIntervalMinutes: number;
  gdeltApiUrl: string;
  frontendUrl: string;
  nodeEnv: string;
}

export function loadConfig(): EnvConfig {
  return {
    port: parseInt(process.env.PORT || '3001', 10),
    databasePath: process.env.DATABASE_PATH || './data/news.db',
    groqBaseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    groqApiKey: process.env.GROQ_API_KEY || '',
    groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    refreshIntervalMinutes: parseInt(process.env.REFRESH_INTERVAL_MINUTES || '30', 10),
    gdeltApiUrl: process.env.GDELT_API_URL || 'https://api.gdeltproject.org/api/v2/doc/doc',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}
