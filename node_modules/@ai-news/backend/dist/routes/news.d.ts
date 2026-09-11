import { EnvConfig } from '../config';
export declare function initNewsRoutes(config: EnvConfig): import("express-serve-static-core").Router;
export declare function refreshNews(config: EnvConfig): Promise<{
    success: boolean;
    articlesFetched: number;
    articlesNew: number;
    articlesDuplicated: number;
    error: string | null;
    timestamp: string;
}>;
