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
  isSaved: boolean;
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
  isSaved: boolean | null;
};

export default function NewsPage({ initialFilters }: { initialFilters?: Partial<Filters> } = {}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [filters, setFilters] = useState<Filters>({
    category: "",
    search: "",
    sentiment: "",
    isSaved: null,
    ...initialFilters
  });
  const [loading, setLoading] = useState(true);

  async function load(page = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(filters.category && { category: filters.category }),
        ...(filters.search && { search: filters.search }),
        ...(filters.sentiment && { sentiment: filters.sentiment }),
        ...(filters.isSaved !== null && { isSaved: String(filters.isSaved) })
      });
      const res = await fetch(`/api/news?${params}`);
      const data = await res.json();
      setArticles(data.data || []);
      setCategories(data.categories || []);
      setMeta(data.meta || null);
    } catch (e) {
      console.error(e);
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
          <RefreshButton />
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