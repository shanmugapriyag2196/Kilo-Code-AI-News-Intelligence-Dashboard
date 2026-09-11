import { Article, Tool, Trend, Stats, NewsQueryParams, RefreshResult, AiCategory } from '@ai-news/shared';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export async function fetchHealth(): Promise<{ status: string; timestamp: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchNews(params: NewsQueryParams): Promise<{ articles: Article[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.category) searchParams.set('category', params.category);
  searchParams.set('dateRange', params.dateRange);
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const res = await fetch(`${API_BASE}/news?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch news');
  return res.json();
}

export async function fetchTrendingNews(): Promise<Article[]> {
  const res = await fetch(`${API_BASE}/news/trending`);
  if (!res.ok) throw new Error('Failed to fetch trending news');
  return res.json();
}

export async function fetchTrendingTools(): Promise<Tool[]> {
  const res = await fetch(`${API_BASE}/tools/trending`);
  if (!res.ok) throw new Error('Failed to fetch trending tools');
  return res.json();
}

export async function fetchTrends(): Promise<Trend[]> {
  const res = await fetch(`${API_BASE}/trends`);
  if (!res.ok) throw new Error('Failed to fetch trends');
  return res.json();
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function triggerRefresh(): Promise<RefreshResult> {
  const res = await fetch(`${API_BASE}/refresh`, { method: 'POST' });
  if (!res.ok) throw new Error('Refresh failed');
  return res.json();
}

export async function fetchSaved(): Promise<Article[]> {
  const res = await fetch(`${API_BASE}/saved`);
  if (!res.ok) throw new Error('Failed to fetch saved');
  return res.json();
}

export async function toggleSave(id: string): Promise<Article> {
  const res = await fetch(`${API_BASE}/saved/${encodeURIComponent(id)}`, { method: 'PUT' });
  if (!res.ok) throw new Error('Failed to toggle save');
  return res.json();
}

export async function deleteSaved(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/saved/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete');
}

export const AI_CATEGORIES: readonly AiCategory[] = [
  'AI Coding', 'AI Agents', 'AI Productivity', 'AI Writing',
  'AI Image', 'AI Video', 'AI Audio', 'AI Automation',
  'AI Developer Tools', 'AI Research', 'AI Models', 'Other AI Tools',
];
