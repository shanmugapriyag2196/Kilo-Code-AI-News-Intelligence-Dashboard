import { Trend } from '@ai-news/shared';

interface TrendsPanelProps {
  trends: Trend[];
  loading: boolean;
}

export function TrendsPanel({ trends, loading }: TrendsPanelProps) {
  if (loading) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            AI Trends
          </h3>
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="trend-row trend-row-loading">
            <div className="trend-shimmer" />
            <div className="trend-shimmer short" />
          </div>
        ))}
      </div>
    );
  }

  const directionIcon: Record<string, React.ReactNode> = {
    up: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-lime)" strokeWidth="3"><polyline points="18 15 12 9 6 15" /></svg>,
    down: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-coral)" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>,
    stable: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  };

  const sentimentColor: Record<string, string> = {
    positive: 'var(--accent-lime)',
    negative: 'var(--accent-coral)',
    neutral: 'var(--accent-cyan)',
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          AI Trends
        </h3>
      </div>
      <div className="trends-list">
        {trends.length === 0 ? (
          <div className="panel-empty"><p>No trends data yet</p></div>
        ) : (
          trends.map((trend, i) => (
            <div key={trend.id} className="trend-row">
              <span className="trend-rank">{i + 1}</span>
              <div className="trend-info">
                <div className="trend-topic">{trend.topic}</div>
                <div className="trend-meta">
                  <span className="trend-category-badge">{trend.category}</span>
                  <span className="trend-mentions">{trend.mentionCount} mentions</span>
                </div>
              </div>
              <div className="trend-right">
                <span className="trend-direction">{directionIcon[trend.trendDirection]}</span>
                <div className="trend-bar">
                  <div
                    className="trend-bar-fill"
                    style={{
                      width: `${Math.min(trend.mentionCount * 10, 100)}%`,
                      background: sentimentColor[trend.sentiment],
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
