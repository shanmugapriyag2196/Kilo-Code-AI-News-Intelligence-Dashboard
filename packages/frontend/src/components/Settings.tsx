import { useState, useEffect } from 'react';
import * as api from '../api/client';

interface SettingsProps {
  onBack: () => void;
}

export function SettingsView({ onBack }: SettingsProps) {
  const [stats, setStats] = useState<{ refreshIntervalMinutes: number; sourceAdapter: string; aiAvailable: boolean; lastRefreshAt: string | null } | null>(null);

  useEffect(() => {
    api.fetchStats().then(s => setStats({
      refreshIntervalMinutes: s.refreshIntervalMinutes,
      sourceAdapter: s.sourceAdapter,
      aiAvailable: s.aiAvailable,
      lastRefreshAt: s.lastRefreshAt,
    })).catch(() => {});
  }, []);

  return (
    <div className="settings-view">
      <div className="saved-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </button>
        <h2 className="section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-violet)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          Settings
        </h2>
      </div>
      <div className="settings-content">
        <div className="settings-section">
          <h3 className="settings-section-title">Data Sources</h3>
          <div className="settings-item">
            <div className="settings-item-label">Primary Source</div>
            <div className="settings-item-value">{stats?.sourceAdapter || 'GDELT DOC API'}</div>
            <p className="settings-item-desc">Real-time multilingual news from GDELT's public DOC API. Extensible source adapters available.</p>
          </div>
          <div className="settings-item">
            <div className="settings-item-label">Auto-Refresh Interval</div>
            <div className="settings-item-value">Every {stats?.refreshIntervalMinutes ?? 30} minutes</div>
          </div>
          {stats?.lastRefreshAt && (
            <div className="settings-item">
              <div className="settings-item-label">Last Refresh</div>
              <div className="settings-item-value">{new Date(stats.lastRefreshAt).toLocaleString()}</div>
            </div>
          )}
        </div>
        <div className="settings-section">
          <h3 className="settings-section-title">AI Configuration</h3>
<div className="settings-item">
              <div className="settings-item-label">AI Status</div>
              <div className="settings-item-value ai-status">
                <span className={`status-dot ${stats?.aiAvailable ? '' : 'muted'}`} />
                <span>{stats?.aiAvailable ? 'Active (Groq)' : 'Inactive — set GROQ_API_KEY'}</span>
              </div>
              <p className="settings-item-desc">AI features (summaries, categorization, deduplication) require a Groq API key.</p>
            </div>
        </div>
        <div className="settings-section">
          <h3 className="settings-section-title">Storage</h3>
          <div className="settings-item">
            <div className="settings-item-label">Database</div>
            <div className="settings-item-value">SQLite (local)</div>
          </div>
          <div className="settings-item">
            <div className="settings-item-label">Data Retention</div>
            <div className="settings-item-value">Persistent local</div>
          </div>
        </div>
        <div className="settings-section">
          <h3 className="settings-section-title">About</h3>
          <div className="settings-item">
            <div className="settings-item-label">Version</div>
            <div className="settings-item-value">1.0.0</div>
          </div>
          <div className="settings-item">
            <div className="settings-item-label">Architecture</div>
            <div className="settings-item-value">React + TypeScript Vite / Express + TypeScript</div>
          </div>
        </div>
      </div>
    </div>
  );
}
