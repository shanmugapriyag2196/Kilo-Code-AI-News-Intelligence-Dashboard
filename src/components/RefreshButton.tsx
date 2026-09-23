"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function RefreshButton({ onRefreshed }: { onRefreshed?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/news/refresh", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Refresh failed");
        return;
      }
      setResult(data.data);
      onRefreshed?.();
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={refresh}
        disabled={loading}
        className="flex items-center gap-2 text-sm bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Refreshing..." : "Refresh News"}
      </button>
      {result && (
        <div className="text-xs text-emerald-400 mt-2 space-y-1">
          <p>
            News: {result.news?.new || 0} new ({result.news?.fetched || 0} fetched, {result.news?.duplicatesSkipped || 0} dup) ·{" "}
            Articles: {result.articles?.new || 0} new ({result.articles?.fetched || 0} fetched, {result.articles?.duplicatesSkipped || 0} dup)
          </p>
          {result.tools && (
            <p>Tools: {result.tools?.seeded || 0} seeded</p>
          )}
          {result.news?.errors && result.news.errors.length > 0 && (
            <p className="text-rose-400">News errors: {result.news.errors.slice(0, 3).join("; ")}</p>
          )}
          {result.articles?.errors && result.articles.errors.length > 0 && (
            <p className="text-rose-400">Articles errors: {result.articles.errors.slice(0, 3).join("; ")}</p>
          )}
        </div>
      )}
      {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
    </div>
  );
}