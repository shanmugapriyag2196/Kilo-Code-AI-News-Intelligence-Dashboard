"use client";

import { useEffect, useState } from "react";
import { Globe, RefreshCw, Calendar } from "lucide-react";
import SimpleNewsCard from "@/components/SimpleNewsCard";

interface Article {
  id?: string;
  title: string;
  description: string | null;
  url: string;
  sourceName: string;
  publishedAt: string;
  category: string;
  sentiment: "positive" | "neutral" | "negative";
}

const COUNTRIES = [
  { label: "All Countries", value: "" },
  { label: "India", value: "India" },
  { label: "United States", value: "US" },
  { label: "United Kingdom", value: "UK" },
  { label: "Canada", value: "Canada" },
  { label: "Australia", value: "Australia" }
];

const DATE_FILTERS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "week" },
  { label: "All Time", value: "all" }
];

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [country, setCountry] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: "10",
        dateFilter: dateFilter
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

  useEffect(() => { load(); }, [country, dateFilter]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">News</h2>
        <p className="text-sm text-slate-400 mt-1">
          Top 10 AI news · {DATE_FILTERS.find(d => d.value === dateFilter)?.label}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DATE_FILTERS.map((d) => (
          <button
            key={d.value}
            onClick={() => setDateFilter(d.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              dateFilter === d.value ? "bg-brand-600 border-brand-500 text-white" : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {d.label}
          </button>
        ))}
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

      <button
        onClick={load}
        className="flex items-center gap-2 text-sm bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 rounded-lg transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh
      </button>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-800/30 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-white mb-2">No articles found</h3>
          <p className="text-slate-400">
            No AI news for {DATE_FILTERS.find(d => d.value === dateFilter)?.label.toLowerCase()}{country ? ` in ${country}` : ""}.
          </p>
        </div>
      ) : (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl divide-y divide-slate-700/50">
          {articles.map((a, i) => (
            <SimpleNewsCard key={a.id || a.url} article={a} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}