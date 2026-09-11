import { Article } from '@ai-news/shared';
import { AIService } from './ai';
export declare class DedupService {
    private ai;
    constructor(ai: AIService);
    clusterDuplicates(articles: Article[]): Promise<Map<string, string>>;
    normalizeUrl(url: string): string;
}
