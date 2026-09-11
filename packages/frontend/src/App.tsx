import { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { KPICards } from './components/KPICards';
import { TrendingLead } from './components/TrendingLead';
import { NewsFeed } from './components/NewsFeed';
import { SearchFilters } from './components/SearchFilters';
import { TrendingToolsPanel } from './components/TrendingTools';
import { TrendsPanel } from './components/TrendsPanel';
import { SavedNewsView } from './components/SavedNews';
import { SettingsView } from './components/Settings';
import { useNews, useTrending, useTrendingTools, useTrends, useStats, useRefresh, useSaved } from './hooks/useNews';
import { DateRange, SidebarView } from '@ai-news/shared';

export default function App() {
  const [view, setView] = useState<SidebarView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const news = useNews({ dateRange, search: searchQuery, category });
  const trending = useTrending();
  const tools = useTrendingTools();
  const trendsData = useTrends();
  const stats = useStats();
  const saved = useSaved();
  const refresh = useRefresh();

  const handleRefresh = useCallback(async () => {
    await refresh.doRefresh();
    news.refetch();
  }, [refresh.doRefresh, news.refetch]);

  const handleDateRangeChange = useCallback((r: DateRange) => {
    setDateRange(r);
  }, []);

  const handleCategoryChange = useCallback((c: string) => {
    setCategory(c);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleSetView = useCallback((v: SidebarView) => {
    setView(v);
  }, []);

  const totalSourceCount = new Set([...news.articles, ...trending.articles].map(a => a.sourceDomain)).size;

  const renderContent = () => {
    switch (view) {
      case 'saved':
        return (
          <SavedNewsView
            articles={saved.items}
            loading={saved.loading}
            onRemove={saved.removeSaved}
            onBack={() => handleSetView('dashboard')}
          />
        );
      case 'settings':
        return <SettingsView onBack={() => handleSetView('dashboard')} />;
      case 'categories':
      case 'trends':
      case 'tools':
      case 'trending':
      case 'latest':
      case 'dashboard':
      default:
        return (
          <>
            <KPICards stats={stats.stats} loading={stats.loading} />
            {view === 'dashboard' || view === 'trending' || view === 'latest' ? (
              <TrendingLead articles={trending.articles} loading={trending.loading} />
            ) : null}
            <SearchFilters
              search={searchQuery} onSearchChange={setSearchQuery}
              dateRange={dateRange} onDateRangeChange={handleDateRangeChange}
              category={category} onCategoryChange={handleCategoryChange}
              customFrom={customFrom} onFromChange={setCustomFrom}
              customTo={customTo} onToChange={setCustomTo}
            />
            {view === 'trends' ? (
              <div className="trends-full"><TrendsPanel trends={trendsData.trends} loading={trendsData.loading} /></div>
            ) : (
              <NewsFeed
                articles={news.articles}
                loading={news.loading}
                error={news.error}
                onRetry={news.refetch}
              />
            )}
          </>
        );
    }
  };

  return (
    <div className="app">
      <Sidebar view={view} setView={handleSetView} collapsed={!sidebarOpen} onToggle={handleToggleSidebar} />
      <main className="main-content">
        <TopBar
          onRefresh={handleRefresh}
          refreshing={refresh.refreshing}
          lastRefresh={refresh.lastRefresh}
          onToggleSidebar={handleToggleSidebar}
          sourceCount={totalSourceCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <div className="content-scroll">
          <div className="dashboard-layout">
            <div className="dashboard-main">
              {renderContent()}
            </div>
            <div className="dashboard-rail">
              <TrendingToolsPanel tools={tools.tools} loading={tools.loading} />
              <TrendsPanel trends={trendsData.trends} loading={trendsData.loading} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
