import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Newspaper, Star, BookOpen, Brain, Activity } from "lucide-react";

interface StatsData {
  total: number;
  byCategory: Record<string, number>;
  bySentiment: { positive: number; neutral: number; negative: number };
  favorites: number;
  unread: number;
  lastRefreshed: string | null;
}

export default function StatsCards({ stats }: { stats: StatsData }) {
  const cards = [
    { label: "Total Articles", value: stats.total, icon: Newspaper, color: "text-blue-400" },
    { label: "Unread", value: stats.unread, icon: BookOpen, color: "text-amber-400" },
    { label: "Favorites", value: stats.favorites, icon: Star, color: "text-pink-400" },
    { label: "Positive Sentiment", value: stats.bySentiment.positive, icon: TrendingUp, color: "text-emerald-400" }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">{c.label}</CardTitle>
              <Icon className={`w-5 h-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{c.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}