import { Article } from '@ai-news/shared';
import { formatDistanceToNow } from 'date-fns';

interface TrendingLeadProps {
  articles: Article[];
  loading: boolean;
}

export function TrendingLead({ articles, loading }: TrendingLeadProps) {
  const lead = articles[0];
  const supporting = articles.slice(1, 5);

  if (loading) {
    return (
      <section className="trending-lead">
        <div className="trending-lead-header">
          <h2 className="section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-lime)" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            Trending AI Tools & News — Today
          </h2>
        </div>
        <div className="trending-lead-loading">
          <div className="trending-lead-shimmer" />
          <div className="trending-support-grid">
            {[1, 2, 3].map(i => <div key={i} className="trending-card-shimmer" />)}
          </div>
        </div>
      </section>
    );
  }

  if (!lead) {
    return (
      <section className="trending-lead">
        <div className="trending-lead-header">
          <h2 className="section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-lime)" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            Trending AI Tools & News — Today
          </h2>
        </div>
        <div className="trending-lead-empty">No trending stories yet. Refresh to fetch the latest AI news.</div>
      </section>
    );
  }

  return (
    <section className="trending-lead">
      <div className="trending-lead-header">
        <h2 className="section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-lime)" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          Trending AI Tools & News — Today
        </h2>
      </div>
      <a href={lead.url} target="_blank" rel="noopener noreferrer" className="trending-lead-card">
        <div className="trending-lead-rank">#1</div>
        <div className="trending-lead-content">
          <span className="trending-lead-category">{lead.category}</span>
          <h3 className="trending-lead-title">{lead.title}</h3>
          {lead.summary && <p className="trending-lead-summary">{lead.summary}</p>}
          <div className="trending-lead-meta">
            <span className="trending-source-domain">{lead.sourceDomain}</span>
            <span className="trending-time">{formatDistanceToNow(new Date(lead.publishedAt), { addSuffix: true })}</span>
            <div className="trending-score-badge">
              <div className="score-bar">
                <div className="score-fill" style={{ width: `${lead.trendingScore}%` }} />
              </div>
              <span className="score-value">{Math.round(lead.trendingScore)}</span>
            </div>
          </div>
        </div>
        <span className="trending-read-more">Read &rarr;</span>
      </a>
      {supporting.length > 0 && (
        <div className="trending-support-grid">
          {supporting.map((article, i) => (
            <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="trending-card">
              <span className="trending-card-rank">#{i + 2}</span>
              <div className="trending-card-content">
                <span className="trending-card-category">{article.category}</span>
                <h4 className="trending-card-title">{article.title}</h4>
                <div className="trending-card-meta">
                  <span>{article.sourceDomain}</span>
                  <div className="trending-mini-score" style={{ width: `${article.trendingScore}%` }} />
                </div>
              </div>
              <span className="trending-card-read-more">Read &rarr;</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
