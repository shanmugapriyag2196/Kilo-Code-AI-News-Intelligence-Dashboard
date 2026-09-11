import { Router } from 'express';
import { getAirtable } from '../services/database';
import { StorageService } from '../services/storage';
import { AIService } from '../services/ai';
import { GDELTAdapter } from '../services/gdelt';
import { DedupService } from '../services/dedup';
import { EnvConfig } from '../config';
import { validateNewsQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/asyncHandler';
import { v4 as uuidv4 } from 'uuid';

let storage: StorageService | null = null;
let aiService: AIService | null = null;
let gdeltAdapter: GDELTAdapter | null = null;

export function initNewsRoutes(config: EnvConfig) {
  storage = new StorageService(getAirtable(config), config);
  aiService = new AIService({ baseUrl: config.groqBaseUrl, apiKey: config.groqApiKey, model: config.groqModel });
  gdeltAdapter = new GDELTAdapter(config.gdeltApiUrl);

  const router = Router();

  router.get('/', validateNewsQuery, asyncHandler(async (req, res) => {
    const query = (req as any).validatedQuery;
    const result = await storage!.getArticles({
      search: query.search,
      category: query.category,
      dateRange: query.dateRange,
      from: query.from,
      to: query.to,
      page: query.page,
      limit: query.limit,
    });
    res.json(result);
  }));

  router.get('/trending', asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const articles = await storage!.getTrending(limit);
    res.json(articles);
  }));

  return router;
}

export async function refreshNews(config: EnvConfig): Promise<{ success: boolean; articlesFetched: number; articlesNew: number; articlesDuplicated: number; error: string | null; timestamp: string }> {
  if (!storage) storage = new StorageService(getAirtable(config), config);
  if (!aiService) aiService = new AIService({ baseUrl: config.groqBaseUrl, apiKey: config.groqApiKey, model: config.groqModel });
  if (!gdeltAdapter) gdeltAdapter = new GDELTAdapter(config.gdeltApiUrl);

  const dedup = new DedupService(aiService);

  let articlesFetched = 0;
  let articlesNew = 0;
  let articlesDuplicated = 0;
  let error: string | null = null;

  try {
    const allRawArticles: { title: string; url: string; source: string; domain: string; publishedAt: string; language: string }[] = [];

    for (const query of (await import('../services/gdelt')).AI_QUERIES) {
      try {
        const articles = await gdeltAdapter!.fetch(query, 25);
        allRawArticles.push(...articles);
      } catch (err) {
        console.error(`GDELT query failed for "${query}":`, err);
      }
    }

    articlesFetched = allRawArticles.length;

    const newArticles: { id: string; title: string; url: string; sourceName: string; sourceDomain: string; publishedAt: string; language: string }[] = [];
    for (const raw of allRawArticles) {
      const existing = await storage!.getArticleByUrl(raw.url);
      if (existing) {
        articlesDuplicated++;
        continue;
      }
      articlesNew++;
      newArticles.push({
        id: uuidv4(),
        title: raw.title,
        url: raw.url,
        sourceName: raw.source,
        sourceDomain: raw.domain,
        publishedAt: raw.publishedAt,
        language: raw.language,
      });
    }

    const processedArticles: any[] = [];
    for (const article of newArticles) {
      try {
        const extracted = await (await import('../services/extractor')).extractArticleContent(article.url);
        if (extracted) {
          article.title = extracted.title || article.title;
        }

        const content = extracted?.content || '';
        const classification = await aiService!.classifyArticle(article.title, content || article.title);
        const summary = await aiService!.generateSummary(content, article.title);
        const score = await aiService!.computeTrendingScore({
          title: article.title,
          content: content || '',
          sourceDomain: article.sourceDomain,
          publishedAt: article.publishedAt,
        });

        processedArticles.push({
          id: article.id,
          title: article.title,
          url: article.url,
          sourceName: article.sourceName,
          sourceDomain: article.sourceDomain,
          publishedAt: article.publishedAt,
          language: article.language,
          content,
          summary: summary || '',
          category: classification.category,
          subcategory: classification.subcategory,
          trendingScore: score,
          isLead: score >= 70,
          duplicateGroupId: null,
          relatedArticleIds: [],
          isSaved: false,
        });
      } catch (err) {
        console.error(`Failed to process article ${article.url}:`, err);
      }
    }

    const dedupMap = await dedup.clusterDuplicates(processedArticles);

    const groupMembers = new Map<string, any[]>();
    for (const article of processedArticles) {
      const groupId = dedupMap.get(dedup.normalizeUrl(article.url)) || article.id;
      article.duplicateGroupId = groupId;
      if (!groupMembers.has(groupId)) groupMembers.set(groupId, []);
      groupMembers.get(groupId)!.push(article);
    }

    for (const [, members] of groupMembers) {
      for (const article of members) {
        article.relatedArticleIds = members.filter(m => m.id !== article.id).map(m => m.id);
        await storage!.upsertArticle(article);
      }
    }

    await updateDerivedData();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown refresh error';
    console.error('Refresh failed:', error);
  }

  const timestamp = new Date().toISOString();
  await storage!.logRefresh({
    success: !error,
    articlesFetched,
    articlesNew,
    articlesDuplicated,
    error,
    timestamp,
  });

  return { success: !error, articlesFetched, articlesNew, articlesDuplicated, error, timestamp };
}

async function updateDerivedData() {
  if (!storage) return;

  const topArticles = await storage.getTrending(100);
  const toolKeywords = [
    { name: 'ChatGPT', category: 'AI Productivity' },
    { name: 'Claude', category: 'AI Models' },
    { name: 'GPT-4', category: 'AI Models' },
    { name: 'Gemini', category: 'AI Models' },
    { name: 'Midjourney', category: 'AI Image' },
    { name: 'DALL-E', category: 'AI Image' },
    { name: 'Stable Diffusion', category: 'AI Image' },
    { name: 'Copilot', category: 'AI Coding' },
    { name: 'Cursor', category: 'AI Coding' },
    { name: 'v0.dev', category: 'AI Coding' },
    { name: 'Perplexity', category: 'AI Productivity' },
    { name: 'Notion AI', category: 'AI Productivity' },
    { name: 'Jasper', category: 'AI Writing' },
    { name: 'Runway', category: 'AI Video' },
    { name: 'Sora', category: 'AI Video' },
    { name: 'ElevenLabs', category: 'AI Audio' },
    { name: 'Hugging Face', category: 'AI Developer Tools' },
    { name: 'LangChain', category: 'AI Developer Tools' },
    { name: 'Ollama', category: 'Other AI Tools' },
    { name: 'Llama', category: 'AI Models' },
  ];

  const toolsToUpsert: any[] = [];
  for (const tool of toolKeywords) {
    const matching = topArticles.filter(a => a.title.toLowerCase().includes(tool.name.toLowerCase()));
    if (matching.length > 0) {
      toolsToUpsert.push({
        id: `tool-${tool.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: tool.name,
        description: `${tool.category} tool`,
        category: tool.category,
        trendingScore: matching.reduce((sum, a) => sum + a.trendingScore, 0) / matching.length,
        mentions: matching.length,
        lastMentioned: matching[0].publishedAt,
        sourceArticles: matching.map(a => a.id),
        logoUrl: null,
      });
    }
  }
  await storage.upsertTools(toolsToUpsert);

  const trendTopics = [
    { topic: 'AGI', category: 'AI Research' },
    { topic: 'Multimodal AI', category: 'AI Models' },
    { topic: 'AI Regulation', category: 'AI Research' },
    { topic: 'Open Source LLMs', category: 'AI Developer Tools' },
    { topic: 'AI Safety', category: 'AI Research' },
    { topic: 'AI Agents', category: 'AI Agents' },
    { topic: 'Fine-tuning', category: 'AI Developer Tools' },
    { topic: 'RAG', category: 'AI Developer Tools' },
    { topic: 'AI Chip', category: 'Other AI Tools' },
    { topic: 'Prompt Engineering', category: 'AI Developer Tools' },
  ];

  const trendsToUpsert: any[] = [];
  for (const trend of trendTopics) {
    const matching = topArticles.filter(a => a.title.toLowerCase().includes(trend.topic.toLowerCase()) || (a.content || '').toLowerCase().includes(trend.topic.toLowerCase()));
    if (matching.length > 0) {
      trendsToUpsert.push({
        id: `trend-${trend.topic.toLowerCase().replace(/\s+/g, '-')}`,
        topic: trend.topic,
        category: trend.category,
        mentionCount: matching.length,
        sentiment: 'neutral',
        relatedArticleIds: matching.map(a => a.id),
        trendDirection: (matching.length > 5 ? 'up' : matching.length > 2 ? 'stable' : 'down') as 'up' | 'down' | 'stable',
        period: 'daily',
      });
    }
  }
  await storage.upsertTrends(trendsToUpsert);
}
