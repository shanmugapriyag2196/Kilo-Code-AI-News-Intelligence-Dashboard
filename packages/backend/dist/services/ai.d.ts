export declare class AIService {
    private config;
    private client;
    constructor(config: {
        baseUrl: string;
        apiKey: string;
        model: string;
    });
    isAvailable(): boolean;
    generateSummary(content: string, title: string): Promise<string | null>;
    classifyArticle(title: string, content: string): Promise<{
        category: string;
        subcategory: string | null;
    }>;
    computeSimilarity(text1: string, text2: string): Promise<number>;
    private getEmbedding;
    computeTrendingScore(article: {
        title: string;
        content: string;
        sourceDomain: string;
        publishedAt: string;
    }): Promise<number>;
}
