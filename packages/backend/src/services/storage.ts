import Airtable from 'airtable';
import { Article, Tool, Trend, Stats, RefreshResult } from '@ai-news/shared';
import { v4 as uuidv4 } from 'uuid';
import { EnvConfig } from '../config';

type AirtableRecord<T extends Airtable.FieldSet> = {
  id: string;
  fields: T;
  createdTime: string;
};

type AirtableTableOps<T extends Airtable.FieldSet> = {
  select(params?: Airtable.SelectOptions<T>): {
    all(): Promise<AirtableRecord<T>[]>;
    firstPage(): Promise<AirtableRecord<T>[]>;
  };
  update(recordId: string, recordData: { fields: Partial<T> }, opts?: { typecast?: boolean }): Promise<unknown>;
  create(recordData: { fields: Partial<T> }, opts?: { typecast?: boolean }): Promise<unknown>;
  destroy(recordId: string): Promise<unknown>;
};

interface ArticleFields extends Airtable.FieldSet {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  sourceDomain: string;
  publishedAt: string;
  fetchedAt: string;
  content?: string;
  summary?: string;
  category?: string;
  subcategory?: string;
  trendingScore?: number;
  duplicateGroupId?: string;
  isLead?: boolean;
  language?: string;
  thumbnailUrl?: string;
  relatedArticleIds?: string;
  isSaved?: boolean;
}

interface ToolFields extends Airtable.FieldSet {
  id: string;
  name: string;
  description?: string;
  url?: string;
  category?: string;
  trendingScore?: number;
  mentions?: number;
  lastMentioned?: string;
  sourceArticles?: string;
  logoUrl?: string;
}

interface TrendFields extends Airtable.FieldSet {
  id: string;
  topic: string;
  category?: string;
  mentionCount?: number;
  sentiment?: string;
  relatedArticleIds?: string;
  trendDirection?: string;
  period?: string;
}

interface RefreshLogFields extends Airtable.FieldSet {
  id: string;
  success: boolean;
  articlesFetched?: number;
  articlesNew?: number;
  articlesDuplicated?: number;
  error?: string;
  timestamp: string;
}

type ArticleRecordData = { fields: Partial<ArticleFields> };
type ToolRecordData = { fields: Partial<ToolFields> };
type TrendRecordData = { fields: Partial<TrendFields> };
type RefreshLogRecordData = { fields: Partial<RefreshLogFields> };

export class StorageService {
  constructor(
    private base: Airtable.Base,
    private tables: Pick<EnvConfig, 'airtableArticlesTable' | 'airtableToolsTable' | 'airtableTrendsTable' | 'airtableRefreshLogTable'>,
  ) {}

  private articlesTable(): AirtableTableOps<ArticleFields> {
    return this.base.table<ArticleFields>(this.tables.airtableArticlesTable) as unknown as AirtableTableOps<ArticleFields>;
  }

  private toolsTable(): AirtableTableOps<ToolFields> {
    return this.base.table<ToolFields>(this.tables.airtableToolsTable) as unknown as AirtableTableOps<ToolFields>;
  }

  private trendsTable(): AirtableTableOps<TrendFields> {
    return this.base.table<TrendFields>(this.tables.airtableTrendsTable) as unknown as AirtableTableOps<TrendFields>;
  }

  private refreshLogTable(): AirtableTableOps<RefreshLogFields> {
    return this.base.table<RefreshLogFields>(this.tables.airtableRefreshLogTable) as unknown as AirtableTableOps<RefreshLogFields>;
  }

  private async listRecords<T extends Airtable.FieldSet>(
    table: AirtableTableOps<T>,
    params?: Airtable.SelectOptions<T>,
  ): Promise<AirtableRecord<T>[]> {
    return (await table.select(params).all()) as unknown as AirtableRecord<T>[];
  }

  private async findRecord<T extends Airtable.FieldSet>(
    table: AirtableTableOps<T>,
    filterByFormula: string,
  ): Promise<AirtableRecord<T> | null> {
    const records = (await table.select({ filterByFormula, maxRecords: 1 }).firstPage()) as unknown as AirtableRecord<T>[];
    return records[0] || null;
  }

  private mapArticle(record: AirtableRecord<ArticleFields>): Article {
    const fields = record.fields;
    return {
      id: fields.id || record.id,
      title: fields.title || 'Untitled',
      url: fields.url || '',
      sourceName: fields.sourceName || 'Unknown',
      sourceDomain: fields.sourceDomain || '',
      publishedAt: fields.publishedAt || new Date(0).toISOString(),
      fetchedAt: fields.fetchedAt || fields.publishedAt || new Date(0).toISOString(),
      content: fields.content || '',
      summary: fields.summary || '',
      category: fields.category || 'Other AI Tools',
      subcategory: fields.subcategory || null,
      trendingScore: Number(fields.trendingScore) || 0,
      duplicateGroupId: fields.duplicateGroupId || null,
      isLead: Boolean(fields.isLead),
      language: fields.language || 'en',
      thumbnailUrl: fields.thumbnailUrl || null,
      relatedArticleIds: parseStringArray(fields.relatedArticleIds),
      isSaved: Boolean(fields.isSaved),
    };
  }

  async upsertArticle(article: Partial<Article> & { url: string }): Promise<Article | null> {
    const existing = await this.findRecord(this.articlesTable(), formulaEquals('url', article.url));
    const now = new Date().toISOString();

    if (existing) {
      const fields: Partial<ArticleFields> = {
        trendingScore: article.trendingScore ?? existing.fields.trendingScore,
        summary: article.summary ?? existing.fields.summary,
        category: article.category ?? existing.fields.category,
        subcategory: article.subcategory ?? existing.fields.subcategory,
        content: article.content ?? existing.fields.content,
        duplicateGroupId: article.duplicateGroupId ?? existing.fields.duplicateGroupId,
        relatedArticleIds: JSON.stringify(article.relatedArticleIds ?? parseStringArray(existing.fields.relatedArticleIds)),
        isLead: article.isLead ? true : existing.fields.isLead,
        fetchedAt: now,
      };
      await this.articlesTable().update(existing.id, { fields: compactFields(fields) } as ArticleRecordData, { typecast: true });
      return this.mapArticle({
        ...existing,
        fields: { ...existing.fields, ...compactFields(fields) },
      } as AirtableRecord<ArticleFields>);
    }

    const id = article.id || uuidv4();
    const newArticle: Article = {
      id,
      title: article.title || 'Untitled',
      url: article.url,
      sourceName: article.sourceName || 'Unknown',
      sourceDomain: article.sourceDomain || '',
      publishedAt: article.publishedAt || now,
      fetchedAt: now,
      content: article.content || '',
      summary: article.summary || '',
      category: article.category || 'Other AI Tools',
      subcategory: article.subcategory || null,
      trendingScore: article.trendingScore || 0,
      duplicateGroupId: article.duplicateGroupId || null,
      isLead: article.isLead || false,
      language: article.language || 'en',
      thumbnailUrl: article.thumbnailUrl || null,
      relatedArticleIds: article.relatedArticleIds || [],
      isSaved: article.isSaved || false,
    };

    await this.articlesTable().create({
      fields: {
        id: newArticle.id,
        title: newArticle.title,
        url: newArticle.url,
        sourceName: newArticle.sourceName,
        sourceDomain: newArticle.sourceDomain,
        publishedAt: newArticle.publishedAt,
        fetchedAt: newArticle.fetchedAt,
        content: newArticle.content || undefined,
        summary: newArticle.summary || undefined,
        category: newArticle.category,
        subcategory: newArticle.subcategory || undefined,
        trendingScore: newArticle.trendingScore,
        duplicateGroupId: newArticle.duplicateGroupId || undefined,
        isLead: newArticle.isLead,
        language: newArticle.language,
        thumbnailUrl: newArticle.thumbnailUrl || undefined,
        relatedArticleIds: JSON.stringify(newArticle.relatedArticleIds),
        isSaved: newArticle.isSaved,
      },
    } as ArticleRecordData, { typecast: true });

    return newArticle;
  }

  async getArticleByUrl(url: string): Promise<Article | null> {
    const record = await this.findRecord(this.articlesTable(), formulaEquals('url', url));
    return record ? this.mapArticle(record) : null;
  }

  async getArticles(params: { search?: string; category?: string; dateRange: string; from?: string; to?: string; page?: number; limit?: number }): Promise<{ articles: Article[]; total: number }> {
    const { search, category, dateRange, from, to, page = 1, limit = 50 } = params;
    const conditions: string[] = [];

    if (search) {
      const term = formulaString(search);
      conditions.push(`OR(IFERROR(SEARCH(${term},{title}),0)>0,IFERROR(SEARCH(${term},{content}),0)>0,IFERROR(SEARCH(${term},{sourceName}),0)>0)`);
    }
    if (category) conditions.push(formulaEquals('category', category));
    const dateFilter = buildDateFilter(dateRange, from, to);
    if (dateFilter) conditions.push(dateFilter);

    const queryParams: Airtable.SelectOptions<ArticleFields> = {
      sort: [{ field: 'publishedAt', direction: 'desc' }],
    };
    if (conditions.length) queryParams.filterByFormula = `AND(${conditions.join(',')})`;

    const records = await this.listRecords(this.articlesTable(), queryParams);
    const offset = (page - 1) * limit;
    return {
      articles: records.slice(offset, offset + limit).map(record => this.mapArticle(record)),
      total: records.length,
    };
  }

  async getTrending(limit = 10): Promise<Article[]> {
    const records = await this.listRecords(this.articlesTable(), {
      filterByFormula: '{isLead} = TRUE()',
      sort: [{ field: 'trendingScore', direction: 'desc' }, { field: 'publishedAt', direction: 'desc' }],
      maxRecords: limit,
    });
    if (records.length > 0) return records.map(record => this.mapArticle(record));

    const fallback = await this.listRecords(this.articlesTable(), {
      sort: [{ field: 'trendingScore', direction: 'desc' }, { field: 'publishedAt', direction: 'desc' }],
      maxRecords: limit,
    });
    return fallback.map(record => this.mapArticle(record));
  }

  async getArticlesByGroup(groupId: string): Promise<Article[]> {
    const records = await this.listRecords(this.articlesTable(), {
      filterByFormula: formulaEquals('duplicateGroupId', groupId),
      sort: [{ field: 'publishedAt', direction: 'asc' }],
    });
    return records.map(record => this.mapArticle(record));
  }

  async getTrendingTools(limit = 10): Promise<Tool[]> {
    const records = await this.listRecords(this.toolsTable(), {
      sort: [{ field: 'trendingScore', direction: 'desc' }],
      maxRecords: limit,
    });
    return records.map(record => this.mapTool(record));
  }

  async getTrends(limit = 20): Promise<Trend[]> {
    const records = await this.listRecords(this.trendsTable(), {
      sort: [{ field: 'mentionCount', direction: 'desc' }],
      maxRecords: limit,
    });
    return records.map(record => this.mapTrend(record));
  }

  async getStats(config?: { refreshIntervalMinutes?: number; sourceAdapter?: string }): Promise<Stats> {
    const [articleRecords, toolRecords, trendRecords, refreshRecords] = await Promise.all([
      this.listRecords(this.articlesTable()),
      this.listRecords(this.toolsTable()),
      this.listRecords(this.trendsTable()),
      this.listRecords(this.refreshLogTable(), { sort: [{ field: 'timestamp', direction: 'desc' }], maxRecords: 1 }),
    ]);
    const articles = articleRecords.map(record => this.mapArticle(record));
    const tools = toolRecords.map(record => this.mapTool(record));
    const trends = trendRecords.map(record => this.mapTrend(record));
    const todayStart = new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z';
    const categories: Record<string, number> = {};

    for (const article of articles) categories[article.category] = (categories[article.category] || 0) + 1;
    const lastRefresh = refreshRecords[0] ? this.mapRefreshLog(refreshRecords[0]) : null;

    return {
      totalArticles: articles.length,
      todayArticles: articles.filter(article => article.publishedAt >= todayStart).length,
      trendingTools: tools.length,
      trendingTopics: trends.length,
      newToolsToday: tools.filter(tool => tool.lastMentioned >= todayStart).length,
      majorUpdatesToday: articles.filter(article => article.publishedAt >= todayStart && article.trendingScore >= 60).length,
      categories,
      lastRefreshAt: lastRefresh?.timestamp || null,
      refreshStatus: lastRefresh ? (lastRefresh.success ? 'success' : 'error') : 'idle',
      refreshError: lastRefresh?.error || null,
      aiAvailable: false,
      refreshIntervalMinutes: config?.refreshIntervalMinutes || 30,
      sourceAdapter: config?.sourceAdapter || 'GDELT DOC API',
    };
  }

  async getSaved(): Promise<Article[]> {
    const records = await this.listRecords(this.articlesTable(), {
      filterByFormula: '{isSaved} = TRUE()',
      sort: [{ field: 'publishedAt', direction: 'desc' }],
    });
    return records.map(record => this.mapArticle(record));
  }

  async toggleSave(id: string): Promise<Article | null> {
    const record = await this.findRecord(this.articlesTable(), formulaEquals('id', id));
    if (!record) return null;
    await this.articlesTable().update(record.id, { fields: { isSaved: record.fields.isSaved !== true } } as ArticleRecordData, { typecast: true });
    return this.mapArticle({ ...record, fields: { ...record.fields, isSaved: record.fields.isSaved !== true } } as AirtableRecord<ArticleFields>);
  }

  async deleteArticle(id: string): Promise<boolean> {
    const record = await this.findRecord(this.articlesTable(), formulaEquals('id', id));
    if (!record) return false;
    await this.articlesTable().destroy(record.id);
    return true;
  }

  async logRefresh(result: RefreshResult): Promise<void> {
    await this.refreshLogTable().create({
      fields: {
        id: uuidv4(),
        success: result.success,
        articlesFetched: result.articlesFetched,
        articlesNew: result.articlesNew,
        articlesDuplicated: result.articlesDuplicated,
        error: result.error || undefined,
        timestamp: result.timestamp,
      },
    } as RefreshLogRecordData, { typecast: true });
  }

  async upsertTools(tools: Partial<Tool>[]): Promise<void> {
    for (const tool of tools) {
      if (!tool.id) continue;
      const existing = await this.findRecord(this.toolsTable(), formulaEquals('id', tool.id));
      const mentions = ((existing ? this.mapTool(existing).mentions : 0) + (tool.mentions ? 1 : 0));
      const fields: ToolFields = {
        id: tool.id,
        name: tool.name || '',
        description: tool.description || '',
        category: tool.category || 'General',
        trendingScore: tool.trendingScore || 0,
        mentions,
        lastMentioned: tool.lastMentioned || new Date().toISOString(),
        sourceArticles: JSON.stringify(tool.sourceArticles || []),
        logoUrl: tool.logoUrl || undefined,
      };
      if (existing) {
        await this.toolsTable().update(existing.id, { fields } as ToolRecordData, { typecast: true });
      } else {
        await this.toolsTable().create({ fields } as ToolRecordData, { typecast: true });
      }
    }
  }

  async upsertTrends(trends: Partial<Trend>[]): Promise<void> {
    for (const trend of trends) {
      if (!trend.id) continue;
      const existing = await this.findRecord(this.trendsTable(), formulaEquals('id', trend.id));
      const fields: TrendFields = {
        id: trend.id,
        topic: trend.topic || '',
        category: trend.category || 'General',
        mentionCount: trend.mentionCount || 0,
        sentiment: trend.sentiment || 'neutral',
        relatedArticleIds: JSON.stringify(trend.relatedArticleIds || []),
        trendDirection: trend.trendDirection || 'stable',
        period: trend.period || 'daily',
      };
      if (existing) {
        await this.trendsTable().update(existing.id, { fields } as TrendRecordData, { typecast: true });
      } else {
        await this.trendsTable().create({ fields } as TrendRecordData, { typecast: true });
      }
    }
  }

  private mapTool(record: AirtableRecord<ToolFields>): Tool {
    const fields = record.fields;
    return {
      id: fields.id || record.id,
      name: fields.name || '',
      description: fields.description || '',
      url: fields.url || '',
      category: fields.category || 'General',
      trendingScore: Number(fields.trendingScore) || 0,
      mentions: Number(fields.mentions) || 0,
      lastMentioned: fields.lastMentioned || '',
      sourceArticles: parseStringArray(fields.sourceArticles),
      logoUrl: fields.logoUrl || null,
    };
  }

  private mapTrend(record: AirtableRecord<TrendFields>): Trend {
    const fields = record.fields;
    return {
      id: fields.id || record.id,
      topic: fields.topic || '',
      category: fields.category || 'General',
      mentionCount: Number(fields.mentionCount) || 0,
      sentiment: (fields.sentiment as Trend['sentiment']) || 'neutral',
      relatedArticleIds: parseStringArray(fields.relatedArticleIds),
      trendDirection: (fields.trendDirection as Trend['trendDirection']) || 'stable',
      period: fields.period || 'daily',
    };
  }

  private mapRefreshLog(record: AirtableRecord<RefreshLogFields>): RefreshResult {
    const fields = record.fields;
    return {
      success: Boolean(fields.success),
      articlesFetched: Number(fields.articlesFetched) || 0,
      articlesNew: Number(fields.articlesNew) || 0,
      articlesDuplicated: Number(fields.articlesDuplicated) || 0,
      error: fields.error || null,
      timestamp: fields.timestamp,
    };
  }
}

function formulaString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function formulaEquals(field: string, value: string): string {
  return `{${field}} = ${formulaString(value)}`;
}

function compactFields<T extends Record<string, unknown>>(fields: T): Partial<T> {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined && value !== null)) as Partial<T>;
}

function parseStringArray(value?: string): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function buildDateFilter(dateRange: string, from?: string, to?: string): string | null {
  const now = new Date();
  switch (dateRange) {
    case 'today':
      return `{publishedAt} >= DATETIME_PARSE(${formulaString(new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString())})`;
    case 'yesterday': {
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      return `AND({publishedAt} >= DATETIME_PARSE(${formulaString(yesterdayStart)}),{publishedAt} < DATETIME_PARSE(${formulaString(todayStart)}))`;
    }
    case '7d':
      return `{publishedAt} >= DATETIME_PARSE(${formulaString(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())})`;
    case '30d':
      return `{publishedAt} >= DATETIME_PARSE(${formulaString(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())})`;
    case 'custom':
      if (from) return `{publishedAt} >= DATETIME_PARSE(${formulaString(from)})`;
      if (to) return `{publishedAt} <= DATETIME_PARSE(${formulaString(to + 'T23:59:59')})`;
      return null;
    default:
      return null;
  }
}
