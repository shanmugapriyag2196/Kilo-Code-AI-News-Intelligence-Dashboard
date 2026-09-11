import { Article } from '@ai-news/shared';
import { formatDistanceToNow } from 'date-fns';

interface SavedNewsProps {
  articles: Article[];
  loading: boolean;
  onRemove: (id: string) => void;
  onBack: () => void;
}

export function SavedNewsView({ articles, loading, onRemove, onBack }: SavedNewsProps) {
  return (
    <div className="saved-view">
      <div className="saved-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </button>
        <h2 className="section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
          Saved News
        </h2>
      </div>
      {loading ? (
        <div className="saved-loading">
          {[1, 2, 3].map(i => <div key={i} className="saved-shimmer-row" />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="saved-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
          <p>No saved articles yet</p>
          <span>Save articles to access them here</span>
        </div>
      ) : (
        <div className="saved-list">
          {articles.map(article => (
            <div key={article.id} className="saved-card">
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="saved-card-content">
                <span className="saved-category">{article.category}</span>
                <h3 className="saved-title">{article.title}</h3>
                {article.summary && <p className="saved-summary">{article.summary}</p>}
                <div className="saved-meta">
                  <span>{article.sourceName}</span>
                  <span className="mono">{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
                </div>
              </a>
              <button className="saved-remove-btn" onClick={() => onRemove(article.id)} title="Remove">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
