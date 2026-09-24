import { Newspaper, Star, BookOpen, Wrench, Cpu, Activity, TrendingUp } from "lucide-react";

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

export default function StatsCards({ stats }: { stats: StatsData }) {
  const cards: { label: string; value: number; icon: any; color: string }[] = [
    { label: "Articles", value: stats.total, icon: Newspaper, color: "text-blue-400" },
    { label: "News", value: stats.newsCount, icon: BookOpen, color: "text-indigo-400" },
    { label: "Tools", value: stats.toolsCount, icon: Wrench, color: "text-violet-400" },
    { label: "Technology", value: stats.technologyCount, icon: Cpu, color: "text-emerald-400" },
    { label: "Saved", value: stats.saved, icon: Star, color: "text-pink-400" },
    { label: "Positive", value: stats.bySentiment.positive, icon: TrendingUp, color: "text-emerald-400" },
    { label: "Last Refreshed", value: stats.lastRefreshed ? 1 : 0, icon: Activity, color: "text-brand-400" }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const isLast = c.label === "Last Refreshed";
        const value = isLast
          ? (stats.lastRefreshed ? new Date(stats.lastRefreshed).toLocaleDateString() : "Never")
          : c.value;
        return (
          <div key={c.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-brand-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{c.label}</span>
              <Icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
          </div>
        );
      })}
    </div>
  );
}