export interface EnvConfig {
  port: number;
  airtableApiKey: string;
  airtableBaseId: string;
  airtableArticlesTable: string;
  airtableToolsTable: string;
  airtableTrendsTable: string;
  airtableRefreshLogTable: string;
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
    airtableApiKey: process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || '',
    airtableBaseId: process.env.AIRTABLE_BASE_ID || '',
    airtableArticlesTable: process.env.AIRTABLE_ARTICLES_TABLE || 'Articles',
    airtableToolsTable: process.env.AIRTABLE_TOOLS_TABLE || 'Tools',
    airtableTrendsTable: process.env.AIRTABLE_TRENDS_TABLE || 'Trends',
    airtableRefreshLogTable: process.env.AIRTABLE_REFRESH_LOG_TABLE || 'RefreshLog',
    groqBaseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    groqApiKey: process.env.GROQ_API_KEY || '',
    groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    refreshIntervalMinutes: parseInt(process.env.REFRESH_INTERVAL_MINUTES || '30', 10),
    gdeltApiUrl: process.env.GDELT_API_URL || 'https://api.gdeltproject.org/api/v2/doc/doc',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}
