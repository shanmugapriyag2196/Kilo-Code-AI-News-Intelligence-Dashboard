"use client";

import { useEffect, useState } from "react";
import StatsCards from "@/components/StatsCards";
import { CategoryChart } from "@/components/CategoryChart";
import { SentimentPieChart } from "@/components/SentimentPieChart";
import { RefreshButton } from "@/components/RefreshButton";

interface StatsData {
  total: number;
  byCategory: Record<string, number>;
  bySentiment: { positive: number; neutral: number; negative: number };
  saved: number;
  lastRefreshed: string | null;
  newsCount: number;
  toolsCount: number;
  technologyCount: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stats", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to load stats");
        return;
      }
      setStats(data.data);
      setCategories(data.data.categories || []);
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-800/50 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-800/30 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-800/30 rounded-xl animate-pulse" />
          <div className="h-80 bg-slate-800/30 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-white mb-2">Failed to load dashboard</h3>
        <p className="text-rose-400 text-sm mb-6">{error || "No data available"}</p>
        <button
          onClick={load}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-sm text-slate-400 mt-1">
            AI news overview · Last refreshed:{" "}
            {stats.lastRefreshed
              ? new Date(stats.lastRefreshed).toLocaleString()
              : "Never"}
          </p>
        </div>
        <RefreshButton onRefreshed={load} />
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CategoryChart data={stats.byCategory} />
        </div>
        <div>
          <SentimentPieChart data={stats.bySentiment} />
        </div>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Top Categories</h3>
        <div className="space-y-2">
          {Object.entries(stats.byCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{cat}</span>
                <span className="text-slate-400">{count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}