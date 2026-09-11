export declare function extractArticleContent(url: string): Promise<{
    title: string;
    content: string;
} | null>;
export declare function estimateReadingTime(content: string): number;
