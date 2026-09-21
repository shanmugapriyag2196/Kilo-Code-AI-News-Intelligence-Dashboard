interface SimpleArticle {
  id?: string;
  title: string;
  description: string | null;
  url: string;
  sourceName: string;
  publishedAt: string;
  category: string;
  sentiment: "positive" | "neutral" | "negative";
}

interface SimpleNewsCardProps {
  article: SimpleArticle;
  index: number;
}

export default function SimpleNewsCard({ article, index }: SimpleNewsCardProps) {
  const sentimentColors: Record<string, string> = {
    positive: "text-emerald-400",
    neutral: "text-slate-400",
    negative: "text-rose-400"
  };

  const dateStr = new Date(article.publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="flex gap-3 p-3 rounded-lg hover:bg-slate-800/40 transition-colors border border-slate-700/30">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-500/15 text-brand-300 text-xs font-bold flex items-center justify-center mt-0.5">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2">
          {article.title}
        </h4>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
          {article.description || "No description available"}
        </p>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
          <span className={`px-1.5 py-0.5 rounded ${sentimentColors[article.sentiment]}`}>
            {article.sentiment}
          </span>
          <span>{article.sourceName}</span>
          <span>·</span>
          <span>{dateStr}</span>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-brand-400 hover:text-brand-300"
          >
            Read →
          </a>
        </div>
      </div>
    </div>
  );
}