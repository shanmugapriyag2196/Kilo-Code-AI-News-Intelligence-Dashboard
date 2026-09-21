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
    tableName: process.env.AIRTABLE_TABLE_NAME || "AI_News"
  };
}

export function getTable() {
  const { base, tableName } = getAirtableBase();
  return base(tableName);
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
    const tableName = process.env.AIRTABLE_TABLE_NAME || "Articles";
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
    search,
    sentiment,
    dateFilter = "all",
    country,
    sort = "publishedAt",
    order = "desc"
  } = options;

  const table = getTable();
  const filters: string[] = [];

  if (category) filters.push(`{category} = '${category}'`);
  if (sentiment) filters.push(`{sentiment} = '${sentiment}'`);

  if (country) {
    const escapedCountry = country.replace(/'/g, "\\'");
    filters.push(`OR(CONTAINS('${escapedCountry}', {sourceName}), CONTAINS('${escapedCountry}', {sourceDomain}))`);
  }

  if (search) {
    const escaped = search.replace(/'/g, "\\'");
    filters.push(
      `OR(CONTAINS('${escaped}', {title}), CONTAINS('${escaped}', {summary}), CONTAINS('${escaped}', {content}))`
    );
  }

  const filterByFormula = filters.length ? filters.join(" AND ") : undefined;

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
  let allRecords = await fetchAllRecords(table);

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