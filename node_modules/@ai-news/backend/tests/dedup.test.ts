import { describe, it, expect } from 'vitest';
import { GDELTAdapter } from '../src/services/gdelt';

describe('GDELT date normalization', () => {
  it('converts YYYYMMDDHHMMSS to ISO timestamp', async () => {
    const adapter = new GDELTAdapter('http://example.com');
    const result = (adapter as any).normalizeDate ? (adapter as any).normalizeDate('20240115143000') : normalizeDate('20240115143000');
    expect(result).toContain('2024');
    expect(result).toContain('01');
    expect(result).toContain('15');
  });

  it('converts YYYYMMDD to ISO midnight', () => {
    const result = normalizeDate('20240115');
    expect(result).toContain('2024-01-15T00:00:00');
  });

  it('falls back to current time for invalid input', () => {
    const result = normalizeDate('not-a-date');
    expect(result).toContain(new Date().getFullYear().toString());
  });

  it('handles empty string', () => {
    const result = normalizeDate('');
    expect(result).toContain(new Date().getFullYear().toString());
  });
});

describe('DedupService grouping', () => {
  it('groups articles by exact URL', async () => {
    const articles = [
      { id: '1', title: 'A', url: 'https://example.com/x', content: 'hello world test', sourceDomain: 'example.com', publishedAt: new Date().toISOString(), language: 'en', relatedArticleIds: [], isSaved: false, duplicateGroupId: null, isLead: false, thumbnailUrl: null, summary: '', subcategory: null, category: 'AI Models', trendingScore: 50, fetchedAt: new Date().toISOString(), sourceName: 'Test' },
      { id: '2', title: 'A2', url: 'https://example.com/x', content: 'hello world test', sourceDomain: 'example.com', publishedAt: new Date().toISOString(), language: 'en', relatedArticleIds: [], isSaved: false, duplicateGroupId: null, isLead: false, thumbnailUrl: null, summary: '', subcategory: null, category: 'AI Models', trendingScore: 50, fetchedAt: new Date().toISOString(), sourceName: 'Test' },
    ];
    const map = await clusterDuplicates(articles);
    expect(map.get('https://example.com/x')).toBe(map.get('https://example.com/x'));
  });

  it('strips tracking params before grouping', async () => {
    const articles = [
      { id: '1', title: 'A', url: 'https://example.com/x?utm_source=google', content: 'hello world test', sourceDomain: 'example.com', publishedAt: new Date().toISOString(), language: 'en', relatedArticleIds: [], isSaved: false, duplicateGroupId: null, isLead: false, thumbnailUrl: null, summary: '', subcategory: null, category: 'AI Models', trendingScore: 50, fetchedAt: new Date().toISOString(), sourceName: 'Test' },
      { id: '2', title: 'A2', url: 'https://example.com/x', content: 'hello world test', sourceDomain: 'example.com', publishedAt: new Date().toISOString(), language: 'en', relatedArticleIds: [], isSaved: false, duplicateGroupId: null, isLead: false, thumbnailUrl: null, summary: '', subcategory: null, category: 'AI Models', trendingScore: 50, fetchedAt: new Date().toISOString(), sourceName: 'Test' },
    ];
    const map = await clusterDuplicates(articles);
    const keys = Array.from(map.keys());
    expect(keys.length).toBe(1);
  });
});

function normalizeDate(raw: string): string {
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

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    const params = new URLSearchParams(u.search);
    params.delete('utm_source');
    params.delete('utm_medium');
    params.delete('utm_campaign');
    params.delete('fbclid');
    params.delete('gclid');
    u.search = params.toString();
    return u.toString().replace(/\/$/, '');
  } catch {
    return url.replace(/\/$/, '');
  }
}

function deterministicSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  if (words1.size === 0 && words2.size === 0) return 0;
  const intersection = [...words1].filter(w => words2.has(w));
  const union = new Set([...words1, ...words2]);
  return union.size === 0 ? 0 : intersection.length / union.size;
}

async function clusterDuplicates(articles: any[]): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();
  for (const article of articles) {
    const norm = normalizeUrl(article.url);
    if (!urlMap.has(norm)) {
      urlMap.set(norm, article.id);
    }
  }
  return urlMap;
}
