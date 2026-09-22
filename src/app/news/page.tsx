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

const TOOLS = [
  { label: "All Tools", value: "" },
  { label: "OpenAI", value: "OpenAI" },
  { label: "ChatGPT", value: "ChatGPT" },
  { label: "Anthropic", value: "Anthropic" },
  { label: "Claude", value: "Claude" },
  { label: "Google Gemini", value: "Gemini" },
  { label: "Google NotebookLM", value: "NotebookLM" },
  { label: "Meta", value: "Meta" },
  { label: "Make", value: "Make" },
  { label: "N8N", value: "N8N" },
  { label: "Copilot", value: "Copilot" },
  { label: "DeepSeek", value: "DeepSeek" },
  { label: "Perplexity", value: "Perplexity" },
  { label: "Midjourney", value: "Midjourney" },
  { label: "Hugging Face", value: "Hugging Face" },
  { label: "Stable Diffusion", value: "Stable Diffusion" },
  { label: "NVIDIA", value: "NVIDIA" }
];

function detectTool(a: Article): string {
  const hay = `${a.title || ""} ${a.summary || ""} ${a.description || ""}`.toLowerCase();
  if (/(chatgpt|openai)/i.test(hay)) return "OpenAI / ChatGPT";
  if (/(claude|anthropic)/i.test(hay)) return "Anthropic / Claude";
  if (/(gemini|notebooklm|dream beans|bard)/i.test(hay)) return "Google Gemini / NotebookLM";
  if (/\bmeta\b/i.test(hay)) return "Meta";
  if (/\bmake\b/i.test(hay)) return "Make";
  if (/\bn8n\b/i.test(hay)) return "N8N";
  if (/copilot/i.test(hay)) return "Copilot";
  if (/deepseek/i.test(hay)) return "DeepSeek";
  if (/perplexity/i.test(hay)) return "Perplexity";
  if (/midjourney/i.test(hay)) return "Midjourney";
  if (/(hugging ?face)/i.test(hay)) return "Hugging Face";
  if (/(stable diffusion)/i.test(hay)) return "Stable Diffusion";
  if (/nvidia/i.test(hay)) return "NVIDIA";
  return "Other AI Tools";
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

  // Group articles by detected tool
  const groups = new Map<string, Article[]>();
  for (const a of articles) {
    const tool = detectTool(a);
    if (!groups.has(tool)) groups.set(tool, []);
    groups.get(tool)!.push(a);
  }
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">AI Tool Updates</h2>
          <p className="text-sm text-slate-400 mt-1">
            Latest AI tool releases &amp; updates · {DATE_FILTERS.find(d => d.value === dateFilter)?.label}
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
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-800/30 rounded-xl animate-pulse" />
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
        <div className="space-y-6">
          {sortedGroups.map(([tool, items]) => (
            <div key={tool} className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-700/50 bg-slate-800/60">
                <h3 className="text-base font-semibold text-white">{tool}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
                  {items.length}
                </span>
              </div>
              <div className="divide-y divide-slate-700/30">
                {items.map((a) => {
                  const dateStr = new Date(a.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  });
                  return (
                    <div key={a.id || a.url} className="flex gap-3 px-5 py-3 hover:bg-slate-800/30 transition-colors">
                      <div className="flex flex-col items-center pt-1">
                        <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                      </div>
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
                        </p>
                        {a.summary && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.summary}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          {a.sourceName} · {dateStr}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}