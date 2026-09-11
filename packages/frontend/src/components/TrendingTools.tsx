import { Tool } from '@ai-news/shared';

interface TrendingToolsProps {
  tools: Tool[];
  loading: boolean;
}

export function TrendingToolsPanel({ tools, loading }: TrendingToolsProps) {
  if (loading) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-lime)" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
            Trending AI Tools
          </h3>
        </div>
        <div className="tools-list">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="tool-row tool-row-loading">
              <div className="tool-shimmer" />
              <div className="tool-shimmer short" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-lime)" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
            Trending AI Tools
          </h3>
        </div>
        <div className="panel-empty">
          <p>No trending tools yet</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-lime)" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
          Trending AI Tools
        </h3>
      </div>
      <div className="tools-list">
        {tools.map((tool, i) => (
          <a key={tool.id} href={tool.url} target="_blank" rel="noopener noreferrer" className="tool-row">
            <div className="tool-rank">{i + 1}</div>
            <div className="tool-avatar">{getInitials(tool.name)}</div>
            <div className="tool-info">
              <div className="tool-name">{tool.name}</div>
              <div className="tool-category">{tool.category} · {tool.mentions} mentions</div>
            </div>
            <div className="tool-score">
              <div className="mini-meter">
                <div className="mini-meter-fill" style={{ width: `${tool.trendingScore}%` }} />
              </div>
              <span className="mono">{Math.round(tool.trendingScore)}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
