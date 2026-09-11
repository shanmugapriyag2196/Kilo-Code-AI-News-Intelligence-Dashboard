import { Article } from '@ai-news/shared';
import { AIService } from './ai';

const SIMILARITY_THRESHOLD = 0.72;

export class DedupService {
  constructor(private ai: AIService) {}

  async clusterDuplicates(articles: Article[]): Promise<Map<string, string>> {
    const urlMap = new Map<string, string>();
    const groups = new Map<string, Article[]>();

    for (const article of articles) {
      const normalizedUrl = this.normalizeUrl(article.url);
      const existing = urlMap.get(normalizedUrl);
      if (existing) {
        const group = groups.get(existing) || [];
        group.push(article);
        groups.set(existing, group);
      } else {
        urlMap.set(normalizedUrl, article.id);
        groups.set(article.id, [article]);
      }
    }

    const articleIds = Array.from(groups.keys());
    const articlesMap = new Map(articles.map(a => [a.id, a]));

    for (let i = 0; i < articleIds.length; i++) {
      for (let j = i + 1; j < articleIds.length; j++) {
        const a1 = articlesMap.get(articleIds[i]);
        const a2 = articlesMap.get(articleIds[j]);
        if (!a1 || !a2) continue;

        const normUrl1 = this.normalizeUrl(a1.url);
        const normUrl2 = this.normalizeUrl(a2.url);
        if (normUrl1 === normUrl2) continue;

        const similarity = await this.ai.computeSimilarity(
          a1.title + ' ' + (a1.content || '').slice(0, 500),
          a2.title + ' ' + (a2.content || '').slice(0, 500)
        );

        if (similarity >= SIMILARITY_THRESHOLD) {
          const targetGroup = urlMap.get(normUrl2) || articleIds[j];
          urlMap.set(normUrl1, targetGroup);
          const group = groups.get(targetGroup) || [];
          group.push(a1);
          groups.set(targetGroup, group);
        }
      }
    }

    return urlMap;
  }

  normalizeUrl(url: string): string {
    try {
      const u = new URL(url);
      u.hash = '';
      const params = new URLSearchParams(u.search);
      params.delete('utm_source');
      params.delete('utm_medium');
      params.delete('utm_campaign');
      params.delete('fbclid');
      params.delete('gclid');
      u.search = params.toString();
      return u.toString().replace(/\/$/, '');
    } catch {
      return url.replace(/\/$/, '');
    }
  }
}
