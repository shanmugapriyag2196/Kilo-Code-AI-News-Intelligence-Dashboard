import { getDb } from './database';
import { Article, Tool, Trend, Stats, RefreshResult } from '@ai-news/shared';
export declare class StorageService {
    private db;
    constructor(db: ReturnType<typeof getDb>);
    private mapRow;
    upsertArticle(article: Partial<Article> & {
        url: string;
    }): Article | null;
    getArticles(params: {
        search?: string;
        category?: string;
        dateRange: string;
        from?: string;
        to?: string;
        page?: number;
        limit?: number;
    }): {
        articles: Article[];
        total: number;
    };
    getTrending(limit?: number): Article[];
    getArticlesByGroup(groupId: string): Article[];
    getTrendingTools(limit?: number): Tool[];
    getTrends(limit?: number): Trend[];
    getStats(config?: {
        refreshIntervalMinutes?: number;
        sourceAdapter?: string;
    }): Stats;
    getSaved(): Article[];
    toggleSave(id: string): Article | null;
    deleteArticle(id: string): boolean;
    logRefresh(result: RefreshResult): void;
    upsertTools(tools: Partial<Tool>[]): void;
    upsertTrends(trends: Partial<Trend>[]): void;
}
