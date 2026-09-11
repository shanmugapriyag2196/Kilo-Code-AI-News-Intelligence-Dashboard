import { Stats } from '@ai-news/shared';

interface KPICardsProps {
  stats: Stats | null;
  loading: boolean;
}

export function KPICards({ stats, loading }: KPICardsProps) {
  const kpis = [
    { label: "Today's AI News", value: stats?.todayArticles ?? 0, accent: 'cyan' },
    { label: 'Trending AI Tools', value: stats?.trendingTools ?? 0, accent: 'lime' },
    { label: 'New AI Tools', value: stats?.newToolsToday ?? 0, accent: 'violet' },
    { label: 'Major AI Updates', value: stats?.majorUpdatesToday ?? 0, accent: 'coral' },
    { label: 'Trending Topics', value: stats?.trendingTopics ?? 0, accent: 'cyan' },
  ];

  const accentColors: Record<string, { border: string; glow: string; text: string }> = {
    cyan: { border: 'rgba(0,212,255,0.2)', glow: 'rgba(0,212,255,0.06)', text: 'var(--accent-cyan)' },
    lime: { border: 'rgba(163,255,0,0.2)', glow: 'rgba(163,255,0,0.06)', text: 'var(--accent-lime)' },
    violet: { border: 'rgba(124,92,252,0.2)', glow: 'rgba(124,92,252,0.06)', text: 'var(--accent-violet)' },
    coral: { border: 'rgba(255,107,107,0.2)', glow: 'rgba(255,107,107,0.06)', text: 'var(--accent-coral)' },
  };

  if (loading) {
    return (
      <div className="kpi-grid">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="kpi-card kpi-loading">
            <div className="kpi-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="kpi-grid">
      {kpis.map((kpi, i) => {
        const colors = accentColors[kpi.accent];
        return (
          <div
            key={kpi.label}
            className="kpi-card"
            style={{
              borderColor: colors.border,
              boxShadow: `inset 0 1px 0 ${colors.glow}, 0 0 20px ${colors.glow}`,
              animationDelay: `${i * 0.05}s`,
            }}
          >
            <div className="kpi-header">
              <span className="kpi-label">{kpi.label}</span>
            </div>
            <div className="kpi-value" style={{ color: colors.text }}>{kpi.value}</div>
            <div className="kpi-meter" style={{ background: colors.glow }}>
              <div className="kpi-meter-fill" style={{ background: colors.text, width: `${Math.min(kpi.value * 5, 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
