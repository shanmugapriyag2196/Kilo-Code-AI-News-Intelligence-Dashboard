import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Calendar, Tag, Brain, Globe } from "lucide-react";

interface Article {
  id?: string;
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  imageUrl: string | null;
  source: string;
  author: string | null;
  publishedAt: string;
  category: string;
  sentiment: "positive" | "neutral" | "negative";
  summary: string | null;
  tags: string[];
}

async function getArticle(id: string): Promise<Article | null> {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/news?search=&limit=1`, { cache: "no-store" });
    const data = await res.json();
    const found = (data.data || []).find((a: Article) => a.id === id);
    return found || null;
  } catch {
    return null;
  }
}

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id);
  if (!article) notFound();

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
        {article.imageUrl && (
          <div className="relative h-72 overflow-hidden">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
            <span className={`absolute top-4 left-4 text-xs px-3 py-1.5 rounded-full border ${sentimentColors[article.sentiment]}`}>
              {article.sentiment}
            </span>
          </div>
        )}
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-4 flex-wrap">
            <span className="px-2.5 py-1 rounded bg-brand-500/15 text-brand-300 border border-brand-500/30">
              {article.category}
            </span>
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(article.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            <Globe className="w-3.5 h-3.5 ml-auto" />
            <span>{article.source}</span>
          </div>

          <h1 className="text-3xl font-bold text-white leading-tight mb-4">{article.title}</h1>

          {article.summary && (
            <div className="bg-brand-500/5 border border-brand-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-semibold text-brand-300">AI Summary</span>
              </div>
              <p className="text-sm text-slate-300">{article.summary}</p>
            </div>
          )}

          {article.content && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-2">Article Content</h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{article.content}</p>
            </div>
          )}

          {article.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-400">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded bg-slate-700/50 text-slate-300">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-xs text-slate-500">By {article.author || "Unknown author"}</span>
            <a
              href={article.url}
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