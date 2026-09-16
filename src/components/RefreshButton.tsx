"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export function RefreshButton() {
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      await fetch("/api/news/refresh", { method: "POST" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={refresh}
      disabled={loading}
      className="flex items-center gap-2 text-sm bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Refreshing..." : "Refresh News"}
    </button>
  );
}