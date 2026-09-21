"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, RefreshCw, Newspaper, Filter } from "lucide-react";
import NewsCard from "@/components/NewsCard";

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

const COUNTRIES = [
  { label: "All Countries", value: "" },
  { label: "India", value: "India" },
  { label: "United States", value: "US" },
  { label: "United Kingdom", value: "UK" },
  { label: "Canada", value: "Canada" },
  { label: "Australia", value: "Australia" }
];

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: "10",
        dateFilter: "today"
      });
      if (country) params.set("country", country);
      const res = await fetch(`/api/news?${params}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to load news");
        return;
      }
      setArticles(data.data || []);
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [country]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">News</h2>
          <p className="text-sm text-slate-400 mt-1">
            Top 10 AI tools news · Today only
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {COUNTRIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCountry(c.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              country === c.value ? "bg-brand-600 border-brand-500 text-white" : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            {c.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm">
          <strong>Error:</strong> {error}
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
            No AI news for today{country ? ` in ${country}` : ""}. Try refreshing or changing the country filter.
          </p>
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