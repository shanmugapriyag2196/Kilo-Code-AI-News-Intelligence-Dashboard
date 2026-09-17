interface NewsArticle {
  id?: string;
  title: string;
  description: string | null;
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

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const sentimentColors: Record<string, string> = {
  positive: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  neutral: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  negative: "bg-rose-500/15 text-rose-300 border-rose-500/30"
};

export default function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <article className="group bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 rounded-xl overflow-hidden transition-all hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5">
      {article.thumbnailUrl && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={article.thumbnailUrl}
            alt={article.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
          <span className={`absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full border ${sentimentColors[article.sentiment]}`}>
            {article.sentiment}
          </span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <span className="px-2 py-0.5 rounded bg-brand-500/15 text-brand-300 border border-brand-500/30">
            {article.category}
          </span>
          <span>{formatDate(article.publishedAt)}</span>
          <span className="ml-auto">{article.sourceName}</span>
        </div>
        <h3 className="text-base font-semibold text-white leading-snug mb-2 line-clamp-2 group-hover:text-brand-300 transition-colors">
          {article.title}
        </h3>
        {article.summary && (
          <p className="text-sm text-slate-400 line-clamp-2 mb-3">{article.summary}</p>
        )}
        {Array.isArray(article.tags) && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {article.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-300">
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
          <span className="text-xs text-slate-500">{article.author || "Unknown author"}</span>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            Read article →
          </a>
        </div>
      </div>
    </article>
  );
}