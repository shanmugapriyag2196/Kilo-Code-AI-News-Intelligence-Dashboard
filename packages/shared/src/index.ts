export interface Article {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  sourceDomain: string;
  publishedAt: string;
  fetchedAt: string;
  content: string;
  summary: string;
  category: string;
  subcategory: string | null;
  trendingScore: number;
  duplicateGroupId: string | null;
  isLead: boolean;
  language: string;
  thumbnailUrl: string | null;
  relatedArticleIds: string[];
  isSaved: boolean;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  trendingScore: number;
  mentions: number;
  lastMentioned: string;
  sourceArticles: string[];
  logoUrl: string | null;
}

export interface Trend {
  id: string;
  topic: string;
  category: string;
  mentionCount: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  relatedArticleIds: string[];
  trendDirection: 'up' | 'down' | 'stable';
  period: string;
}

export interface Stats {
  totalArticles: number;
  todayArticles: number;
  trendingTools: number;
  trendingTopics: number;
  newToolsToday: number;
  majorUpdatesToday: number;
  categories: Record<string, number>;
  lastRefreshAt: string | null;
  refreshStatus: 'idle' | 'running' | 'error' | 'success';
  refreshError: string | null;
  aiAvailable: boolean;
  refreshIntervalMinutes: number;
  sourceAdapter: string;
}

export type DateRange = 'today' | 'yesterday' | '7d' | '30d' | 'custom';
export type SidebarView = 'dashboard' | 'latest' | 'trending' | 'tools' | 'categories' | 'trends' | 'saved' | 'settings';

export interface NewsQueryParams {
  search?: string;
  category?: string;
  dateRange: DateRange;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface RefreshResult {
  success: boolean;
  articlesFetched: number;
  articlesNew: number;
  articlesDuplicated: number;
  error: string | null;
  timestamp: string;
}

export const AI_CATEGORIES = [
  'AI Coding', 'AI Agents', 'AI Productivity', 'AI Writing',
  'AI Image', 'AI Video', 'AI Audio', 'AI Automation',
  'AI Developer Tools', 'AI Research', 'AI Models', 'Other AI Tools',
] as const;

export type AiCategory = typeof AI_CATEGORIES[number];
