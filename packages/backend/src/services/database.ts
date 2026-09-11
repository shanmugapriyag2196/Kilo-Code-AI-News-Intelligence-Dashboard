import Airtable from 'airtable';
import { EnvConfig } from '../config';

let cached: { key: string; base: Airtable.Base } | null = null;

export function getAirtable(config: EnvConfig): Airtable.Base {
  if (!config.airtableApiKey || !config.airtableBaseId) {
    throw new Error('AIRTABLE_API_KEY and AIRTABLE_BASE_ID are required');
  }

  const key = `${config.airtableApiKey}:${config.airtableBaseId}`;
  if (cached?.key === key) return cached.base;

  const airtable = new Airtable({ apiKey: config.airtableApiKey });
  cached = { key, base: airtable.base(config.airtableBaseId) };
  return cached.base;
}

export function closeDb() {
  cached = null;
}
