import { useState } from 'react';
import { Article } from '@ai-news/shared';
import { formatDistanceToNow, format } from 'date-fns';
import * as api from '../api/client';

interface NewsFeedProps {
  articles: Article[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function NewsFeed({ articles, loading, error, onRetry }: NewsFeedProps) {
  const [savingId, setSavingId] = useState<string | null>(null);

  if (error) {
    return (
      <div className="news-feed-error">
        <div className="error-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-coral)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        </div>
        <p className="error-message">{error}</p>
        <button className="retry-btn" onClick={onRetry}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="news-feed">
        <div className="news-feed-header">
          <h2 className="section-title">Latest News</h2>
        </div>
        <div className="news-feed-list">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="news-row news-row-loading">
              <div className="news-row-shimmer" />
              <div className="news-row-shimmer short" />
              <div className="news-row-shimmer tiny" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="news-feed-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" /></svg>
        <p>No articles match your filters</p>
        <span>Try adjusting your search or date range</span>
      </div>
    );
  }

  const grouped = groupByDate(articles);

  const handleSaveToggle = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSavingId(id);
    try {
      await api.toggleSave(id);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="news-feed">
      <div className="news-feed-header">
        <h2 className="section-title">Latest News</h2>
        <span className="news-feed-count">{articles.length} articles</span>
      </div>
      <div className="news-feed-list">
        {Object.entries(grouped).map(([date, dateArticles]) => (
          <div key={date} className="news-date-group">
            <div className="news-date-header">
              {format(new Date(date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
            </div>
            {dateArticles.map(article => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="news-row"
              >
                <div className="news-row-left">
                  <span className="news-category-chip">{article.category}</span>
                  <h3 className="news-title">{article.title}</h3>
                  {article.summary && <p className="news-summary">{article.summary}</p>}
                  {article.relatedArticleIds.length > 1 && (
                    <div className="news-related-sources">
                      {article.relatedArticleIds.length} related sources
                    </div>
                  )}
                </div>
                <div className="news-row-right">
                  <span className="news-source-badge">{article.sourceName}</span>
                  <span className="news-domain">{article.sourceDomain}</span>
                  <time className="news-time" dateTime={article.publishedAt}>
                    {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                  </time>
                  <button
                    className={`news-save-btn ${article.isSaved ? 'saved' : ''}`}
                    onClick={(e) => handleSaveToggle(e, article.id)}
                    disabled={savingId === article.id}
                    title={article.isSaved ? 'Unsave' : 'Save'}
                  >
                    {article.isSaved ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                    )}
                  </button>
                  <span className="news-read-more">Read &rarr;</span>
                </div>
              </a>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function groupByDate(articles: Article[]): Record<string, Article[]> {
  const groups: Record<string, Article[]> = {};
  for (const article of articles) {
    const dateKey = article.publishedAt.slice(0, 10);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(article);
  }
  return groups;
}
