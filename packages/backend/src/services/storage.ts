import { getDb } from './database';
import { Article, Tool, Trend, Stats, RefreshResult } from '@ai-news/shared';
import { v4 as uuidv4 } from 'uuid';

export class StorageService {
  constructor(private db: ReturnType<typeof getDb>) {}

  private mapRow(row: Record<string, unknown>): Article {
    return {
      id: row.id as string,
      title: row.title as string,
      url: row.url as string,
      sourceName: row.source_name as string,
      sourceDomain: row.source_domain as string,
      publishedAt: row.published_at as string,
      fetchedAt: row.fetched_at as string,
      content: (row.content as string) || '',
      summary: (row.summary as string) || '',
      category: (row.category as string) || 'Other AI Tools',
      subcategory: (row.subcategory as string) || null,
      trendingScore: (row.trending_score as number) || 0,
      duplicateGroupId: (row.duplicate_group_id as string) || null,
      isLead: !!(row.is_lead as number),
      language: (row.language as string) || 'en',
      thumbnailUrl: (row.thumbnail_url as string) || null,
      relatedArticleIds: JSON.parse((row.related_article_ids as string) || '[]'),
      isSaved: !!(row.is_saved as number),
    };
  }

  upsertArticle(article: Partial<Article> & { url: string }): Article | null {
    const existing = this.db.prepare('SELECT * FROM articles WHERE url = ?').get(article.url) as Record<string, unknown> | undefined;
    const now = new Date().toISOString();

    if (existing) {
      this.db.prepare(`
        UPDATE articles SET
          trending_score = COALESCE(?, trending_score),
          summary = COALESCE(?, summary),
          category = COALESCE(?, category),
          subcategory = COALESCE(?, subcategory),
          content = COALESCE(?, content),
          duplicate_group_id = COALESCE(?, duplicate_group_id),
          related_article_ids = ?,
          is_lead = COALESCE(?, is_lead),
          fetched_at = ?
        WHERE id = ?
      `).run(
        article.trendingScore ?? existing.trending_score,
        article.summary ?? existing.summary,
        article.category ?? existing.category,
        article.subcategory ?? existing.subcategory,
        article.content ?? null,
        article.duplicateGroupId ?? existing.duplicate_group_id,
        JSON.stringify(article.relatedArticleIds ?? JSON.parse((existing.related_article_ids as string) || '[]')),
        article.isLead ? 1 : existing.is_lead,
        now,
        existing.id,
      );
      return this.mapRow(this.db.prepare('SELECT * FROM articles WHERE id = ?').get(existing.id) as Record<string, unknown>);
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

    this.db.prepare(`
      INSERT INTO articles (id, title, url, source_name, source_domain, published_at, fetched_at,
        content, summary, category, subcategory, trending_score, duplicate_group_id, is_lead,
        language, thumbnail_url, related_article_ids, is_saved)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newArticle.id, newArticle.title, newArticle.url, newArticle.sourceName,
      newArticle.sourceDomain, newArticle.publishedAt, newArticle.fetchedAt,
      newArticle.content, newArticle.summary, newArticle.category, newArticle.subcategory,
      newArticle.trendingScore, newArticle.duplicateGroupId, newArticle.isLead ? 1 : 0,
      newArticle.language, newArticle.thumbnailUrl,
      JSON.stringify(newArticle.relatedArticleIds), newArticle.isSaved ? 1 : 0,
    );

    return newArticle;
  }

  getArticles(params: { search?: string; category?: string; dateRange: string; from?: string; to?: string; page?: number; limit?: number }): { articles: Article[]; total: number } {
    const { search, category, dateRange, from, to, page = 1, limit = 50 } = params;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: (string | number)[] = [];

    const dateFilter = buildDateFilter(dateRange, values, from, to);

    if (search) {
      conditions.push('(title LIKE ? OR content LIKE ? OR source_name LIKE ?)');
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) {
      conditions.push('category = ?');
      values.push(category);
    }

    const whereClause = 'WHERE ' + (conditions.length > 0 ? conditions.join(' AND ') + ' ' + dateFilter : '1=1 ' + dateFilter);
    const orderClause = 'ORDER BY published_at DESC';

    const totalRow = this.db.prepare(`SELECT COUNT(*) as count FROM articles ${whereClause}`).get(...values) as { count: number };
    const rows = this.db.prepare(`SELECT * FROM articles ${whereClause} ${orderClause} LIMIT ? OFFSET ?`).all(...values, limit, offset) as Record<string, unknown>[];

    return {
      articles: rows.map(r => this.mapRow(r)),
      total: totalRow.count,
    };
  }

  getTrending(limit = 10): Article[] {
    const rows = this.db.prepare('SELECT * FROM articles WHERE is_lead = 1 ORDER BY trending_score DESC, published_at DESC LIMIT ?').all(limit) as Record<string, unknown>[];
    const results = rows.map(r => this.mapRow(r));
    if (results.length > 0) return results;
    const fallbackRows = this.db.prepare('SELECT * FROM articles ORDER BY trending_score DESC, published_at DESC LIMIT ?').all(limit) as Record<string, unknown>[];
    return fallbackRows.map(r => this.mapRow(r));
  }

  getArticlesByGroup(groupId: string): Article[] {
    const rows = this.db.prepare('SELECT * FROM articles WHERE duplicate_group_id = ? ORDER BY published_at ASC').all(groupId) as Record<string, unknown>[];
    return rows.map(r => this.mapRow(r));
  }

  getTrendingTools(limit = 10): Tool[] {
    const rows = this.db.prepare('SELECT * FROM tools ORDER BY trending_score DESC LIMIT ?').all(limit) as Record<string, unknown>[];
    return rows.map(r => ({
      id: r.id as string,
      name: r.name as string,
      description: (r.description as string) || '',
      url: (r.url as string) || '',
      category: (r.category as string) || 'General',
      trendingScore: (r.trending_score as number) || 0,
      mentions: (r.mentions as number) || 0,
      lastMentioned: (r.last_mentioned as string) || '',
      sourceArticles: JSON.parse((r.source_articles as string) || '[]'),
      logoUrl: (r.logo_url as string) || null,
    }));
  }

  getTrends(limit = 20): Trend[] {
    const rows = this.db.prepare('SELECT * FROM trends ORDER BY mention_count DESC LIMIT ?').all(limit) as Record<string, unknown>[];
    return rows.map(r => ({
      id: r.id as string,
      topic: r.topic as string,
      category: (r.category as string) || 'General',
      mentionCount: (r.mention_count as number) || 0,
      sentiment: (r.sentiment as 'positive' | 'negative' | 'neutral') || 'neutral',
      relatedArticleIds: JSON.parse((r.related_article_ids as string) || '[]'),
      trendDirection: (r.trend_direction as 'up' | 'down' | 'stable') || 'stable',
      period: (r.period as string) || 'daily',
    }));
  }

  getStats(config?: { refreshIntervalMinutes?: number; sourceAdapter?: string }): Stats {
    const totalRow = this.db.prepare('SELECT COUNT(*) as count FROM articles').get() as { count: number };
    const todayStart = new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z';
    const todayRow = this.db.prepare('SELECT COUNT(*) as count FROM articles WHERE published_at >= ?').get(todayStart) as { count: number };
    const toolsRow = this.db.prepare('SELECT COUNT(*) as count FROM tools').get() as { count: number };
    const trendsRow = this.db.prepare('SELECT COUNT(*) as count FROM trends').get() as { count: number };

    const newToolsTodayRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM tools WHERE date(last_mentioned) = date('now')
    `).get() as { count: number };

    const majorUpdatesTodayRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM articles WHERE published_at >= ? AND trending_score >= 60
    `).get(todayStart) as { count: number };

    const catRows = this.db.prepare('SELECT category, COUNT(*) as count FROM articles GROUP BY category').all() as { category: string; count: number }[];
    const categories: Record<string, number> = {};
    for (const row of catRows) categories[row.category] = row.count;

    const lastRefresh = this.db.prepare('SELECT * FROM refresh_log ORDER BY timestamp DESC LIMIT 1').get() as { success: number; error: string | null; timestamp: string } | undefined;

    return {
      totalArticles: totalRow.count,
      todayArticles: todayRow.count,
      trendingTools: toolsRow.count,
      trendingTopics: trendsRow.count,
      newToolsToday: newToolsTodayRow.count,
      majorUpdatesToday: majorUpdatesTodayRow.count,
      categories,
      lastRefreshAt: lastRefresh?.timestamp || null,
      refreshStatus: lastRefresh ? (lastRefresh.success ? 'success' : 'error') : 'idle',
      refreshError: lastRefresh?.error || null,
      aiAvailable: false,
      refreshIntervalMinutes: config?.refreshIntervalMinutes || 30,
      sourceAdapter: config?.sourceAdapter || 'GDELT DOC API',
    };
  }

  getSaved(): Article[] {
    const rows = this.db.prepare('SELECT * FROM articles WHERE is_saved = 1 ORDER BY published_at DESC').all() as Record<string, unknown>[];
    return rows.map(r => this.mapRow(r));
  }

  toggleSave(id: string): Article | null {
    const existing = this.db.prepare('SELECT * FROM articles WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) return null;
    const newSaved = existing.is_saved ? 0 : 1;
    this.db.prepare('UPDATE articles SET is_saved = ? WHERE id = ?').run(newSaved, id);
    return this.mapRow(this.db.prepare('SELECT * FROM articles WHERE id = ?').get(id) as Record<string, unknown>);
  }

  deleteArticle(id: string): boolean {
    const result = this.db.prepare('DELETE FROM articles WHERE id = ?').run(id);
    return (result as { changes: number }).changes > 0;
  }

  logRefresh(result: RefreshResult) {
    this.db.prepare(`
      INSERT INTO refresh_log (id, success, articles_fetched, articles_new, articles_duplicated, error, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), result.success ? 1 : 0, result.articlesFetched, result.articlesNew, result.articlesDuplicated, result.error, result.timestamp);
  }

  upsertTools(tools: Partial<Tool>[]) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO tools (id, name, description, url, category, trending_score, mentions, last_mentioned, source_articles, logo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const tool of tools) {
      const existing = this.db.prepare('SELECT * FROM tools WHERE id = ?').get(tool.id) as Record<string, unknown> | undefined;
      const mentions = ((existing?.mentions as number) || 0) + (tool.mentions ? 1 : 0);
      stmt.run(tool.id, tool.name, tool.description || '', tool.url, tool.category || 'General',
        tool.trendingScore || 0, mentions, tool.lastMentioned || new Date().toISOString(),
        JSON.stringify(tool.sourceArticles || []), tool.logoUrl || null);
    }
  }

  upsertTrends(trends: Partial<Trend>[]) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO trends (id, topic, category, mention_count, sentiment, related_article_ids, trend_direction, period)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const trend of trends) {
      stmt.run(trend.id, trend.topic, trend.category || 'General', trend.mentionCount || 0,
        trend.sentiment || 'neutral', JSON.stringify(trend.relatedArticleIds || []),
        trend.trendDirection || 'stable', trend.period || 'daily');
    }
  }
}

function buildDateFilter(dateRange: string, values: (string | number)[], from?: string, to?: string): string {
  const now = new Date();
  switch (dateRange) {
    case 'today':
      values.push(new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString());
      return 'AND published_at >= ?';
    case 'yesterday': {
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      values.push(yesterdayStart, todayStart);
      return 'AND published_at >= ? AND published_at < ?';
    }
    case '7d':
      values.push(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
      return 'AND published_at >= ?';
    case '30d':
      values.push(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());
      return 'AND published_at >= ?';
    case 'custom':
      if (from) { values.push(from); return 'AND published_at >= ?'; }
      if (to) { values.push(to + 'T23:59:59'); return 'AND published_at <= ?'; }
      return '';
    default:
      return '';
  }
}
