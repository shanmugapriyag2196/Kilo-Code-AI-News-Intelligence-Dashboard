"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

interface Article {
  id?: string;
  title: string;
  description: string | null;
  url: string;
  sourceName: string;
  publishedAt: string;
  category: string;
  sentiment: "positive" | "neutral" | "negative";
  summary: string | null;
}

const DATE_FILTERS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "week" },
  { label: "All Time", value: "all" }
];

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [dateFilter, setDateFilter] = useState("today");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: "20",
        sort: "publishedAt",
        order: "desc",
        dateFilter: dateFilter
      });
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

  useEffect(() => { load(); }, [dateFilter]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Top AI Tool Updates</h2>
          <p className="text-sm text-slate-400 mt-1">
            {DATE_FILTERS.find(d => d.value === dateFilter)?.label}
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

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
        <div>
          <label className="text-xs font-medium text-slate-400 mb-2 block">Date Range</label>
          <div className="flex flex-wrap gap-2">
            {DATE_FILTERS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDateFilter(d.value)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  dateFilter === d.value ? "bg-brand-600 border-brand-500 text-white" : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-800/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-white mb-2">No updates found</h3>
          <p className="text-slate-400">
            No AI tool updates for {DATE_FILTERS.find(d => d.value === dateFilter)?.label.toLowerCase()}.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {articles.slice(0, 10).map((a, i) => {
            const dateStr = new Date(a.publishedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            });
            return (
              <div key={a.id || a.url} className="flex gap-3 px-2 py-2 hover:bg-slate-800/30 rounded-lg transition-colors">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-500/15 text-brand-300 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 leading-relaxed">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brand-300 transition-colors"
                    >
                      {a.title}
                    </a>
                    {a.summary && (
                      <span className="text-slate-400">: {a.summary}</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {a.sourceName} · {dateStr}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}