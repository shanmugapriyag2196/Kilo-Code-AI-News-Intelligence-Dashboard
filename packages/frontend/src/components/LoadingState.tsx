
export function LoadingSkeleton() {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </div>
        <p className="loading-text">Fetching AI news intelligence...</p>
        <div className="loading-bar">
          <div className="loading-bar-fill" />
        </div>
      </div>
    </div>
  );
}

export function KPISkeleton() {
  return (
    <div className="kpi-skeleton-grid">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="kpi-skeleton">
          <div className="skeleton-line short" />
          <div className="skeleton-line medium" />
        </div>
      ))}
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="feed-skeleton">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="feed-skeleton-row">
          <div className="skeleton-line" style={{ width: '60px', height: '20px' }} />
          <div className="skeleton-line" style={{ flex: 1 }} />
          <div className="skeleton-line short" />
        </div>
      ))}
    </div>
  );
}
