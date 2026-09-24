"use client";

import { useEffect, useState } from "react";

interface TechUpdate {
  id?: string;
  tool: string;
  category: "RPA" | "Automation" | "BI";
  update: string;
  date: string;
  url: string;
  impact: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  RPA: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Automation: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  BI: "bg-amber-500/15 text-amber-300 border-amber-500/30"
};

export default function TechnologySection() {
  const [updates, setUpdates] = useState<TechUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/technology");
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to load");
        setUpdates(data.data || []);
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
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-800/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-rose-400 text-sm">Error: {error}</div>;
  }

  if (updates.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">⚙️</div>
        <h3 className="text-xl font-semibold text-white mb-2">No technology updates yet</h3>
        <p className="text-slate-400">RPA, automation, and BI updates will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-slate-400 bg-slate-800/60">
            <th className="px-5 py-3 font-medium">Tool</th>
            <th className="px-5 py-3 font-medium">Category</th>
            <th className="px-5 py-3 font-medium">Recent Update</th>
            <th className="px-5 py-3 font-medium">Date</th>
            <th className="px-5 py-3 font-medium">Impact</th>
            <th className="px-5 py-3 font-medium">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {updates.map((u) => (
            <tr key={u.id || u.url} className="hover:bg-slate-800/30 transition-colors">
              <td className="px-5 py-3 font-semibold text-white whitespace-nowrap">{u.tool}</td>
              <td className="px-5 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${CATEGORY_STYLES[u.category] || "bg-slate-500/15 text-slate-300 border-slate-500/30"}`}>
                  {u.category}
                </span>
              </td>
              <td className="px-5 py-3 text-slate-300 max-w-md">
                <p className="line-clamp-2">{u.update}</p>
              </td>
              <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{u.date}</td>
              <td className="px-5 py-3 text-slate-300 max-w-xs">
                <p className="line-clamp-2 text-xs">{u.impact}</p>
              </td>
              <td className="px-5 py-3">
                {u.url ? (
                  <a
                    href={u.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-300 hover:text-brand-200 transition-colors text-xs"
                  >
                    View →
                  </a>
                ) : (
                  <span className="text-slate-600 text-xs">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}