import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
export async function extractArticleContent(url) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; AI-News-Dashboard/1.0; +https://example.com/bot)',
                Accept: 'text/html,application/xhtml+xml',
            },
        });
        clearTimeout(timeout);
        if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
            return null;
        }
        const html = await response.text();
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();
        if (!article || !article.textContent || article.textContent.length < 200) {
            return null;
        }
        return {
            title: article.title || '',
            content: article.textContent.slice(0, 15000),
        };
    }
    catch {
        return null;
    }
}
export function estimateReadingTime(content) {
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
}
//# sourceMappingURL=extractor.js.map