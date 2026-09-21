"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Calendar, Tag, Brain, Globe } from "lucide-react";
import { getArticleById } from "@/lib/airtable";

interface Article {
  id?: string;
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  thumbnailUrl: string | null;
  sourceName: string;
  author: string | null;
  publishedAt: string;
  category: string;
  sentiment: "positive" | "neutral" | "negative";
  summary: string | null;
  tags: string[];
}

export default function ArticlePage({ params }: { params: { id: string } }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getArticleById(params.id);
        if (!data) {
          setError("Article not found");
        } else {
          setArticle(data as Article);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load article");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-32 bg-slate-800/50 rounded animate-pulse" />
        <div className="h-96 bg-slate-800/40 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to news
        </Link>
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">Article not found</h3>
          <p className="text-slate-400 mb-2">
            Could not find article with ID: <code className="text-brand-300">{params.id}</code>
          </p>
          {error && <p className="text-rose-400 text-sm mb-6">Error: {error}</p>}
          <p className="text-slate-500 text-sm">
            Try clicking <strong>Refresh News</strong> on the main page first.
          </p>
        </div>
      </div>
    );
  }

  const safe: Article = {
    id: article.id,
    title: article.title || "Untitled",
    description: article.description || null,
    content: article.content || null,
    url: article.url || "#",
    thumbnailUrl: article.thumbnailUrl || null,
    sourceName: article.sourceName || "Unknown",
    author: article.author || null,
    publishedAt: article.publishedAt || new Date().toISOString(),
    category: article.category || "General",
    sentiment: (article.sentiment as any) || "neutral",
    summary: article.summary || null,
    tags: Array.isArray(article.tags) ? article.tags : []
  };

  const sentimentColors: Record<string, string> = {
    positive: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    neutral: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    negative: "bg-rose-500/15 text-rose-300 border-rose-500/30"
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to news
      </Link>

      <article className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
        {safe.thumbnailUrl && (
          <div className="relative h-72 overflow-hidden">
            <img
              src={safe.thumbnailUrl}
              alt={safe.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
            <span className={`absolute top-4 left-4 text-xs px-3 py-1.5 rounded-full border ${sentimentColors[safe.sentiment]}`}>
              {safe.sentiment}
            </span>
          </div>
        )}
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-4 flex-wrap">
            <span className="px-2.5 py-1 rounded bg-brand-500/15 text-brand-300 border border-brand-500/30">
              {safe.category}
            </span>
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(safe.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            <Globe className="w-3.5 h-3.5 ml-auto" />
            <span>{safe.sourceName}</span>
          </div>

          <h1 className="text-3xl font-bold text-white leading-tight mb-4">{safe.title}</h1>

          {safe.summary && (
            <div className="bg-brand-500/5 border border-brand-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-semibold text-brand-300">AI Summary</span>
              </div>
              <p className="text-sm text-slate-300">{safe.summary}</p>
            </div>
          )}

          {safe.content && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-2">Article Content</h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{safe.content}</p>
            </div>
          )}

          {safe.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-400">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {safe.tags.map((tag: string) => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded bg-slate-700/50 text-slate-300">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-xs text-slate-500">By {safe.author || "Unknown author"}</span>
            <a
              href={safe.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Read full article <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}