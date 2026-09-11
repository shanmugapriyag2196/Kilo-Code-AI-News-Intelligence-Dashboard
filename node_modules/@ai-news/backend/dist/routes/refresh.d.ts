export declare function createRefreshRoutes(refreshFn: () => Promise<{
    success: boolean;
    articlesFetched: number;
    articlesNew: number;
    articlesDuplicated: number;
    error: string | null;
    timestamp: string;
}>): import("express-serve-static-core").Router;
