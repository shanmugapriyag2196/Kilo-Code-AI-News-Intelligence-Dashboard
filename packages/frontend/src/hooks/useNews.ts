import { useEffect, useState, useCallback } from 'react';
import { Article, Tool, Trend, Stats, DateRange, SidebarView } from '@ai-news/shared';
import * as api from '../api/client';

export function useNews(params: { dateRange: DateRange; search: string; category: string }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.fetchNews({ ...params, page: 1, limit: 50 });
      setArticles(result.articles);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setLoading(false);
    }
  }, [params.dateRange, params.search, params.category]);

  useEffect(() => { load(); }, [load]);

  return { articles, total, loading, error, refetch: load };
}

export function useTrending() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.fetchTrendingNews()
      .then(data => { if (!cancelled) { setArticles(data); setLoading(false); } })
      .catch(err => { if (!cancelled) { setError(err instanceof Error ? err.message : 'Error'); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  return { articles, loading, error };
}

export function useTrendingTools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.fetchTrendingTools().then(data => { if (!cancelled) { setTools(data); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  return { tools, loading };
}

export function useTrends() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.fetchTrends().then(data => { if (!cancelled) { setTrends(data); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  return { trends, loading };
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.fetchStats().then(data => { if (!cancelled) { setStats(data); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  return { stats, loading };
}

export function useSaved() {
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchSaved();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  const toggleSave = useCallback(async (id: string) => {
    await api.toggleSave(id);
    await loadSaved();
  }, [loadSaved]);

  const removeSaved = useCallback(async (id: string) => {
    await api.deleteSaved(id);
    await loadSaved();
  }, [loadSaved]);

  return { items, loading, toggleSave, removeSaved, refresh: loadSaved };
}

export function useRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const result = await api.triggerRefresh();
      setLastRefresh(result.timestamp);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
      throw err;
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { refreshing, lastRefresh, error, doRefresh };
}

export function useCurrentView() {
  const [view, setView] = useState<SidebarView>('dashboard');
  return { view, setView };
}
