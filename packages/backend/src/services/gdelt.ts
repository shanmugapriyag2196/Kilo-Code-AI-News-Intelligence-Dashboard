export interface GDELTArticle {
  title: string;
  url: string;
  source: string;
  domain: string;
  publishedAt: string;
  language: string;
  seendate: string;
}

export class GDELTAdapter {
  constructor(private baseUrl: string) {}

  async fetch(query: string, limit = 50): Promise<GDELTArticle[]> {
    const params = new URLSearchParams({
      query,
      mode: 'artlist',
      format: 'json',
      maxrecords: String(limit),
      sort: 'datedesc',
    });

    const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
      headers: { 'User-Agent': 'AI-News-Dashboard/1.0' },
    });

    if (!response.ok) {
      throw new Error(`GDELT API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const articles: GDELTArticle[] = [];

    if (data.articles && Array.isArray(data.articles)) {
      for (const art of data.articles) {
        const seendate = art.seendate || art.publisheddate || '';
        articles.push({
          title: art.title || '',
          url: art.url || '',
          source: art.source || 'Unknown',
          domain: extractDomain(art.url || ''),
          publishedAt: normalizeGdeltDate(seendate),
          language: art.language || 'en',
          seendate,
        });
      }
    }

    return articles;
  }
}

export const AI_QUERIES = [
  'artificial intelligence',
  'OpenAI',
  'Claude AI',
  'GPT',
  'machine learning',
  'deep learning',
  'neural network',
  'AI model',
  'AI launch',
  'AI tool',
  'generative AI',
  'LLM',
  'language model',
  'AI agent',
  'AI startup',
  'AI funding',
  'AI acquisition',
];

function normalizeGdeltDate(raw: string): string {
  if (!raw) return new Date().toISOString();

  const trimmed = raw.trim();

  if (/^\d{14}$/.test(trimmed)) {
    const year = trimmed.slice(0, 4);
    const month = trimmed.slice(4, 6);
    const day = trimmed.slice(6, 8);
    const hour = trimmed.slice(8, 10) || '00';
    const minute = trimmed.slice(10, 12) || '00';
    const second = trimmed.slice(12, 14) || '00';
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).toISOString();
  }

  if (/^\d{8}$/.test(trimmed)) {
    const year = trimmed.slice(0, 4);
    const month = trimmed.slice(4, 6);
    const day = trimmed.slice(6, 8);
    return new Date(`${year}-${month}-${day}T00:00:00Z`).toISOString();
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return new Date().toISOString();
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
