"use client";

import { useEffect, useState } from "react";

interface TechRecord {
  id?: string;
  [key: string]: any;
}

const EXCLUDE_FIELDS = ["id", "createdAt", "createdTime"];

function truncate(text: string, max = 120): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "..." : text;
}

export default function TechnologySection() {
  const [records, setRecords] = useState<TechRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/technology");
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to load");
        setRecords(data.data || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const columns: string[] = records.length
    ? Object.keys(records[0]).filter((k) => !EXCLUDE_FIELDS.includes(k))
    : [];

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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

  if (records.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">⚙️</div>
        <h3 className="text-xl font-semibold text-white mb-2">No technology updates yet</h3>
        <p className="text-slate-400">RPA, automation, and BI updates will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-400 bg-slate-800/60">
              {columns.map((col) => (
                <th key={col} className="px-5 py-3 font-medium whitespace-nowrap">{col}</th>
              ))}
              <th className="px-5 py-3 font-medium whitespace-nowrap">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {records.map((r) => {
              const id = r.id || r.URL || JSON.stringify(r);
              const isExpanded = expanded.has(id);
              return (
                <tr key={id} className="hover:bg-slate-800/30 transition-colors align-top">
                  {columns.map((col) => {
                    const val = r[col];
                    const display = isExpanded ? (val || "—") : truncate(String(val || ""), 140);
                    return (
                      <td key={col} className="px-5 py-3 text-slate-200 max-w-md">
                        <p className="line-clamp-2">{display || "—"}</p>
                      </td>
                    );
                  })}
                  <td className="px-5 py-3 whitespace-nowrap">
                    <button
                      onClick={() => toggle(id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors"
                    >
                      {isExpanded ? "Hide" : "Show"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {records.map((r) => {
        const id = r.id || r.URL || JSON.stringify(r);
        if (!expanded.has(id)) return null;
        return (
          <div key={id} className="bg-slate-800/40 border border-brand-500/40 rounded-xl p-5">
            <h4 className="text-base font-semibold text-white mb-3">
              Full Details — {r.Tool || r["Tool"] || ""}
            </h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {columns.map((col) => (
                <div key={col}>
                  <dt className="text-xs uppercase tracking-wider text-slate-400">{col}</dt>
                  <dd className="text-sm text-slate-200 mt-0.5 break-words whitespace-pre-wrap">
                    {r[col] || "—"}
                  </dd>
                </div>
              ))}
            </dl>
            <button
              onClick={() => toggle(id)}
              className="mt-4 text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              Hide
            </button>
          </div>
        );
      })}
    </div>
  );
}