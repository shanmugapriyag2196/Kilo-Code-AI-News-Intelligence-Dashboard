import { Suspense } from "react";
import StatsCards from "@/components/StatsCards";
import { CategoryChart } from "@/components/CategoryChart";
import { RefreshButton } from "@/components/RefreshButton";

interface StatsData {
  total: number;
  byCategory: Record<string, number>;
  bySentiment: { positive: number; neutral: number; negative: number };
  saved: number;
  lastRefreshed: string | null;
}

interface DashboardResponse {
  success: boolean;
  data: StatsData;
}

async function getDashboardData(): Promise<StatsData> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/stats`, { cache: "no-store" });
  const json: DashboardResponse = await res.json();
  return json.data;
}

export default async function DashboardPage() {
  const stats = await getDashboardData();

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
        <RefreshButton />
      </div>

      <Suspense fallback={<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-800/30 rounded-xl animate-pulse" />
        ))}
      </div>}>
        <StatsCards stats={stats} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CategoryChart data={stats.byCategory} />
        </div>
        <div className="space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Sentiment Breakdown</h3>
            <div className="space-y-3">
              {(["positive", "neutral", "negative"] as const).map((s) => {
                const total = stats.total || 1;
                const pct = Math.round((stats.bySentiment[s] / total) * 100);
                const colors: Record<string, string> = {
                  positive: "bg-emerald-500",
                  neutral: "bg-slate-500",
                  negative: "bg-rose-500"
                };
                return (
                  <div key={s}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-300 capitalize">{s}</span>
                      <span className="text-slate-400">{stats.bySentiment[s]} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[s]} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-3">Top Categories</h3>
            <div className="space-y-2">
              {Object.entries(stats.byCategory)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{cat}</span>
                    <span className="text-slate-400">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}