"use client";

import { useEffect, useState } from "react";

interface Tool {
  id?: string;
  name: string;
  description: string;
  category: string;
  releaseDate: string;
  url: string;
  icon: string;
}

export default function ToolsSection() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tools");
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to load");
        setTools(data.data || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 bg-slate-800/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-rose-400 text-sm">Error: {error}</div>;
  }

  if (tools.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🛠️</div>
        <h3 className="text-xl font-semibold text-white mb-2">No tools yet</h3>
        <p className="text-slate-400">AI tool releases will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {tools.map((t) => (
        <div key={t.id || t.url} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 hover:border-brand-500/50 transition-colors">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{t.icon || "🤖"}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-white mb-1">{t.name}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{t.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
                  {t.category}
                </span>
                <span className="text-xs text-slate-500">{t.releaseDate}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}