import Airtable from "airtable";

export function getAirtableBase() {
  const { AIRTABLE_BASE_ID, AIRTABLE_API_KEY } = process.env;

  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    throw new Error(
      "Airtable credentials missing. Set AIRTABLE_BASE_ID and AIRTABLE_API_KEY in environment."
    );
  }

  return {
    base: new Airtable({
      apiKey: AIRTABLE_API_KEY,
      endpointUrl: "https://api.airtable.com",
    }).base(AIRTABLE_BASE_ID),
    articlesTable: process.env.AIRTABLE_ARTICLES_TABLE || "Articles",
    newsTable: process.env.AIRTABLE_NEWS_TABLE || "News",
    toolsTable: process.env.AIRTABLE_TOOLS_TABLE || "Tools",
    technologyTable: process.env.AIRTABLE_TECHNOLOGY_TABLE || "Technology"
  };
}

export function getArticlesTable() {
  const { base, articlesTable } = getAirtableBase();
  return base(articlesTable);
}

export function getNewsTable() {
  const { base, newsTable } = getAirtableBase();
  return base(newsTable);
}

export function getToolsTable() {
  const { base, toolsTable } = getAirtableBase();
  return base(toolsTable);
}

export function getTechnologyTable() {
  const { base, technologyTable } = getAirtableBase();
  return base(technologyTable);
}

// Legacy alias for backward compat
export function getTable() {
  return getArticlesTable();
}

export async function findArticleByHash(hash: string) {
  const table = getTable();
  const records = await table
    .select({
      filterByFormula: `{hash} = '${hash}'`,
      maxRecords: 1
    })
    .all();
  return records[0] ?? null;
}

export async function findArticleByTitle(title: string) {
  const table = getTable();
  const records = await table
    .select({
      filterByFormula: `LOWER({title}) = LOWER('${title.replace(/'/g, "\\'")}')`,
      maxRecords: 1
    })
    .all();
  return records[0] ?? null;
}

export async function findArticleByURL(url: string) {
  const table = getTable();
  const records = await table
    .select({
      filterByFormula: `{url} = '${url}'`,
      maxRecords: 1
    })
    .all();
  return records[0] ?? null;
}

export async function findArticleByDuplicateGroupId(duplicateGroupId: string) {
  const table = getTable();
  const records = await table
    .select({
      filterByFormula: `{duplicateGroupId} = '${duplicateGroupId}'`,
      maxRecords: 1
    })
    .all();
  return records[0] ?? null;
}

export async function getExistingTags(): Promise<string[]> {
  try {
    const { AIRTABLE_BASE_ID, AIRTABLE_API_KEY } = process.env;
    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) return [];
    const tableName = process.env.AIRTABLE_ARTICLES_TABLE || "Articles";
    const res = await fetch(
      `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
        cache: "no-store"
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const table = (data.tables || []).find((t: any) => t.name === tableName);
    if (!table) return [];
    const tagsField = table.fields.find((f: any) => f.name === "tags");
    if (!tagsField || !tagsField.options) return [];
    return (tagsField.options.choices || []).map((c: any) => c.name).filter(Boolean);
  } catch {
    return [];
  }
}

export async function getArticleById(id: string): Promise<any | null> {
  try {
    const table = getTable();
    const record: any = await table.find(id);
    const fields = { ...record.fields };
    // Remove any user-defined "id" field so the Airtable record ID is preserved
    delete fields.id;
    return { id: record.id, ...fields };
  } catch (e: any) {
    console.error("getArticleById error:", id, e?.message);
    return null;
  }
}

export async function createArticle(fields: Record<string, any>, existingTags?: string[]) {
  const table = getTable();
  if (existingTags && Array.isArray(fields.tags)) {
    fields.tags = fields.tags.filter((t: string) => existingTags.includes(t));
  }
  const clean = stripEmptyFields(fields);
  let attempt = 0;
  let current = { ...clean };
  while (attempt < 10) {
    try {
      return (await table.create([{ fields: current }]))[0];
    } catch (e: any) {
      const msg = e.message || String(e);
      const selectMatch = msg.match(/create new select option "+"([^"]+)"/) ||
        msg.match(/create new select option "([^"]+)"/);
      if (!selectMatch) {
        throw new Error(`createArticle failed (fields: ${Object.keys(clean).join(", ")}): ${msg}`);
      }
      const badField = findFieldForTag(current, selectMatch[1]);
      if (!badField) {
        throw new Error(`createArticle failed (fields: ${Object.keys(clean).join(", ")}): ${msg}`);
      }
      current[badField] = (current[badField] as string[]).filter((t) => t !== selectMatch[1]);
      attempt++;
    }
  }
  throw new Error(`createArticle failed: too many unknown select options`);
}

function findFieldForTag(fields: Record<string, any>, tag: string): string | null {
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v) && v.includes(tag)) return k;
  }
  return null;
}

function stripEmptyFields(fields: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    // Coerce numbers to strings — Airtable single-line-text fields reject raw numbers
    if (typeof v === "number") {
      out[k] = String(v);
      continue;
    }
    out[k] = v;
  }
  return out;
}

export async function updateArticle(recordId: string, fields: Record<string, any>) {
  const table = getTable();
  const updated = await table.update([{ id: recordId, fields }]);
  return updated[0];
}

export async function listArticles(options: {
  page?: number;
  limit?: number;
  category?: string;
  subcategory?: string;
  search?: string;
  sentiment?: string;
  dateFilter?: "today" | "yesterday" | "week" | "all";
  country?: string;
  sort?: "publishedAt" | "fetchedAt";
  order?: "asc" | "desc";
}) {
  const {
    page = 1,
    limit = 20,
    category,
    subcategory,
    search,
    sentiment,
    dateFilter = "all",
    country,
    sort = "publishedAt",
    order = "desc"
  } = options;

  const table = getTable();
  const conditions: string[] = [];

  if (category) conditions.push(`{category} = '${category}'`);
  if (sentiment) conditions.push(`{sentiment} = '${sentiment}'`);

  if (subcategory) {
    const escaped = subcategory.replace(/'/g, "\\'");
    conditions.push(`{subcategory} = '${escaped}'`);
  }

  const filterByFormula = conditions.length === 0
    ? undefined
    : conditions.length === 1
      ? conditions[0]
      : `AND(${conditions.join(", ")})`;

  const sortSpec =
    sort === "fetchedAt"
      ? [{ field: "fetchedAt", direction: order }]
      : [{ field: "publishedAt", direction: order }];

  const listOptions: any = {
    sort: sortSpec,
    pageSize: 100
  };
  if (filterByFormula) listOptions.filterByFormula = filterByFormula;

  // Fetch all records using pagination (Airtable max page size is 100)
  let allRecords = await fetchAllRecords(table, listOptions);

  // Filter by search, country, and date in JavaScript
  const searchLower = search ? search.toLowerCase() : null;
  const countryLower = country ? country.toLowerCase() : null;

  if (searchLower || countryLower) {
    allRecords = allRecords.filter((r: any) => {
      const f = r.fields || {};
      if (searchLower) {
        const hay = `${f.title || ""} ${f.summary || ""} ${f.content || ""}`.toLowerCase();
        if (!hay.includes(searchLower)) return false;
      }
      if (countryLower) {
        const hay = `${f.sourceName || ""} ${f.sourceDomain || ""}`.toLowerCase();
        if (!hay.includes(countryLower)) return false;
      }
      return true;
    });
  }

  // Filter by date in JavaScript (publishedAt is text, not a date field)
  if (dateFilter && dateFilter !== "all") {
    const now = new Date();
    let startDate: Date;
    let endDate: Date | null = null;
    if (dateFilter === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateFilter === "yesterday") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateFilter === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    const startMs = startDate!.getTime();
    const endMs = endDate ? endDate.getTime() : Infinity;

    allRecords = allRecords.filter((r: any) => {
      const pub = r.fields?.publishedAt;
      if (!pub) return false;
      const pubDate = new Date(pub).getTime();
      return !isNaN(pubDate) && pubDate >= startMs && pubDate < endMs;
    });
  }

  const total = allRecords.length;
  const pageOffset = (page - 1) * limit;
  const pagedRecords = allRecords.slice(pageOffset, pageOffset + limit);

  return {
    records: pagedRecords,
    total,
    page,
    limit,
hasMore: pageOffset + limit < total
  };
}

// ── Tools table functions ────────────────────────────────────────

export async function listTools(limit = 20) {
  const table = getToolsTable();
  const records = await table.select({
    sort: [{ field: "createdAt", direction: "desc" }],
    pageSize: limit
  }).all();
  return records;
}

export async function createTool(fields: Record<string, any>) {
  const table = getToolsTable();
  const clean = stripEmptyFields(fields);
  return (await table.create([{ fields: clean }]))[0];
}

export async function listTechnology(limit = 50) {
  const table = getTechnologyTable();
  const records = await table.select({
    sort: [{ field: "Date", direction: "desc" }],
    pageSize: limit
  }).all();
  return records;
}

export async function createTechnology(fields: Record<string, any>) {
  const table = getTechnologyTable();
  const clean = stripEmptyFields(fields);
  return (await table.create([{ fields: clean }]))[0];
}

export async function fetchAllRecords(table: any, options: any = {}): Promise<any[]> {
  let allRecords: any[] = [];
  let offset: string | null = null;
  do {
    const pageOptions: any = { ...options, pageSize: 100 };
    if (offset) pageOptions.offset = offset;
    const pageRecords = await table.select(pageOptions).all();
    allRecords = allRecords.concat(pageRecords);
    offset = (pageRecords as any).offset || null;
  } while (offset);
  return allRecords;
}

export async function getStats() {
  const table = getTable();
  const all = await fetchAllRecords(table);

  const byCategory: Record<string, number> = {};
  const bySentiment: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };
  let saved = 0;
  let lastRefreshed: string | null = null;

  for (const r of all) {
    const f = r.fields as any;
    byCategory[f.category] = (byCategory[f.category] || 0) + 1;
    if (f.sentiment) bySentiment[f.sentiment] = (bySentiment[f.sentiment] || 0) + 1;
    if (f.isSaved) saved++;
    if (f.fetchedAt && (!lastRefreshed || f.fetchedAt > lastRefreshed)) lastRefreshed = f.fetchedAt;
  }

  return {
    total: all.length,
    byCategory,
    bySentiment,
    saved,
    lastRefreshed
  };
}

export async function getAllStats() {
  const articles = await getStats();
  let newsCount = 0;
  let toolsCount = 0;
  let technologyCount = 0;

  try {
    const news = await fetchAllRecords(getNewsTable());
    newsCount = news.length;
  } catch { /* ignore */ }

  try {
    const tools = await fetchAllRecords(getToolsTable());
    toolsCount = tools.length;
  } catch { /* ignore */ }

  try {
    const tech = await fetchAllRecords(getTechnologyTable());
    technologyCount = tech.length;
  } catch { /* ignore */ }

  return {
    ...articles,
    newsCount,
    toolsCount,
    technologyCount
  };
}

export async function getDistinctCategories() {
  const table = getTable();
  const all = await fetchAllRecords(table);
  const cats = new Set<string>();
  for (const r of all) {
    const c = (r.fields as any).category;
    if (c) cats.add(c);
  }
  return Array.from(cats).sort();
}

// ── News table functions ────────────────────────────────────────

export async function findNewsByHash(hash: string) {
  const table = getNewsTable();
  const records = await table
    .select({
      filterByFormula: `{hash} = '${hash}'`,
      maxRecords: 1
    })
    .all();
  return records[0] ?? null;
}

export async function findNewsByURL(url: string) {
  const table = getNewsTable();
  const records = await table
    .select({
      filterByFormula: `{url} = '${url}'`,
      maxRecords: 1
    })
    .all();
  return records[0] ?? null;
}

export async function createNews(fields: Record<string, any>) {
  const table = getNewsTable();
  const clean = stripEmptyFields(fields);
  return (await table.create([{ fields: clean }]))[0];
}

export async function listNews(options: {
  page?: number;
  limit?: number;
  dateFilter?: "today" | "yesterday" | "week" | "all";
  sort?: "publishedAt" | "fetchedAt";
  order?: "asc" | "desc";
}) {
  const {
    page = 1,
    limit = 20,
    dateFilter = "all",
    sort = "publishedAt",
    order = "desc"
  } = options;

  const table = getNewsTable();
  const sortSpec =
    sort === "fetchedAt"
      ? [{ field: "fetchedAt", direction: order }]
      : [{ field: "publishedAt", direction: order }];

  const listOptions: any = {
    sort: sortSpec,
    pageSize: 100
  };

  let allRecords = await fetchAllRecords(table, listOptions);

  // Filter by date in JavaScript (publishedAt is text, not a date field)
  if (dateFilter && dateFilter !== "all") {
    const now = new Date();
    let startDate: Date;
    let endDate: Date | null = null;
    if (dateFilter === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateFilter === "yesterday") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateFilter === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(0);
    }
    const startMs = startDate!.getTime();
    const endMs = endDate ? endDate.getTime() : Infinity;

    allRecords = allRecords.filter((r: any) => {
      const pub = r.fields?.publishedAt;
      if (!pub) return false;
      const pubDate = new Date(pub).getTime();
      return !isNaN(pubDate) && pubDate >= startMs && pubDate < endMs;
    });
  }

  const total = allRecords.length;
  const pageOffset = (page - 1) * limit;
  const pagedRecords = allRecords.slice(pageOffset, pageOffset + limit);

  return {
    records: pagedRecords,
    total,
    page,
    limit,
    hasMore: pageOffset + limit < total
  };
}