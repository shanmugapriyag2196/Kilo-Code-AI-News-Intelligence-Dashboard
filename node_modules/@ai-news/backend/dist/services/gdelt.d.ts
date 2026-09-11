export interface GDELTArticle {
    title: string;
    url: string;
    source: string;
    domain: string;
    publishedAt: string;
    language: string;
    seendate: string;
}
export declare class GDELTAdapter {
    private baseUrl;
    constructor(baseUrl: string);
    fetch(query: string, limit?: number): Promise<GDELTArticle[]>;
}
export declare const AI_QUERIES: string[];
