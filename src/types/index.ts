export interface NewsArticle {
  id?: string;
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  imageUrl: string | null;
  source: string;
  author: string | null;
  publishedAt: string;
  category: string;
  sentiment: "positive" | "neutral" | "negative";
  summary: string | null;
  tags: string[];
  isRead: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  hash: string;
}

export interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: RawNewsAPIArticle[];
}

export interface RawNewsAPIArticle {
  title: string | null;
  description: string | null;
  content: string | null;
  url: string | null;
  urlToImage: string | null;
  source: { id: string | null; name: string } | null;
  author: string | null;
  publishedAt: string | null;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    lastRefreshed: string | null;
  };
}

export interface RefreshResult {
  fetched: number;
  new: number;
  updated: number;
  duplicatesSkipped: number;
  lastRefreshed: string;
}