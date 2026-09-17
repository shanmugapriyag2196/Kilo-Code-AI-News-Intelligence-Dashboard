"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NewsCard from "@/components/NewsCard";
import Filters from "@/components/Filters";
import { RefreshButton } from "@/components/RefreshButton";

interface Article {
  id?: string;
  title: string;
  description: string | null;
  url: string;
  thumbnailUrl: string | null;
  sourceName: string;
  author: string | null;
  publishedAt: string;
  category: string;
  sentiment: "positive" | "neutral" | "negative";
  summary: string | null;
  tags: string[];
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  lastRefreshed: string | null;
}

type Filters = {
  category: string;
  search: string;
  sentiment: string;
};

export default function NewsPage({ initialFilters }: { initialFilters?: Partial<Filters> } = {}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    category: "",
    search: "",
    sentiment: "",
    ...initialFilters
  });
  const [loading, setLoading] = useState(true);

  async function load(page = 1) {
    setLoading(true);
    setError(null);
    setRawResponse(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(filters.category && { category: filters.category }),
        ...(filters.search && { search: filters.search }),
        ...(filters.sentiment && { sentiment: filters.sentiment })
      });
      const res = await fetch(`/api/news?${params}`);
      const data = await res.json();
      setRawResponse(JSON.stringify(data, null, 2));
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to load articles");
        setArticles([]);
        return;
      }
      setArticles(data.data || []);
      setCategories(data.categories || []);
      setMeta(data.meta || null);
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); }, [filters]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">AI News Feed</h2>
          <p className="text-sm text-slate-400 mt-1">
            {meta ? `${meta.total} articles · Last refreshed: ${meta.lastRefreshed ? new Date(meta.lastRefreshed).toLocaleString() : "Never"}` : "Loading..."}
          </p>
        </div>
        <RefreshButton />
      </div>

      <Filters
        categories={categories}
        value={filters}
        onChange={setFilters}
      />

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm">
          <strong>Error:</strong> {error}
          {rawResponse && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs">Show raw API response</summary>
              <pre className="mt-2 text-xs bg-slate-900 p-2 rounded overflow-auto">{rawResponse}</pre>
            </details>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-800/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-white mb-2">No articles found</h3>
          <p className="text-slate-400 mb-6">
            No AI news matches your current filters. Try adjusting or refresh to fetch new articles.
          </p>
<RefreshButton onRefreshed={() => load(1)} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((a) => (
            <NewsCard key={a.id || a.url} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}