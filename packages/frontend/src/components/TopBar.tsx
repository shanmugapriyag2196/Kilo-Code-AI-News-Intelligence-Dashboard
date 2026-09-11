import { format } from 'date-fns';

interface TopBarProps {
  onRefresh: () => void;
  refreshing: boolean;
  lastRefresh: string | null;
  onToggleSidebar: () => void;
  sourceCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function TopBar({ onRefresh, refreshing, lastRefresh, onToggleSidebar, sourceCount, searchQuery, onSearchChange }: TopBarProps) {
  return (
    <header className="topbar">
      <button className="topbar-menu-btn" onClick={onToggleSidebar} aria-label="Toggle menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
      </button>
      <div className="topbar-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input
          type="text"
          placeholder="Search news..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="topbar-search-input"
        />
      </div>
      <div className="topbar-right">
        <div className="topbar-status">
          <span className="status-dot" />
          <span className="status-text">{sourceCount} sources</span>
        </div>
        <div className="topbar-date">
          {format(new Date(), 'MMM d, yyyy')}
        </div>
        <button
          className={`topbar-refresh-btn ${refreshing ? 'refreshing' : ''}`}
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh news"
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={refreshing ? { animation: 'spin 0.8s linear infinite' } : undefined}
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
        {lastRefresh && (
          <span className="topbar-refresh-time">
            {format(new Date(lastRefresh), 'HH:mm:ss')}
          </span>
        )}
      </div>
    </header>
  );
}
