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

export async function createArticle(fields: Record<string, any>) {
  const table = getTable();
  const clean = stripEmptyFields(fields);
  let attempt = 0;
  let current = { ...clean };
  while (attempt < 10) {
    try {
      return (await table.create([{ fields: current }]))[0];
    } catch (e: any) {
      const msg = e.message || String(e);
      const selectMatch = msg.match(/create new select option "([^"]+)"/);
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
  sort?: "publishedAt" | "fetchedAt";
  order?: "asc" | "desc";
}) {
  const {
    page = 1,
    limit = 20,
    category,
    search,
    sentiment,
    sort = "publishedAt",
    order = "desc"
  } = options;

  const table = getTable();
  const filters: string[] = [];

  if (category) filters.push(`{category} = '${category}'`);
  if (sentiment) filters.push(`{sentiment} = '${sentiment}'`);

  if (search) {
    const escaped = search.replace(/'/g, "\\'");
    filters.push(
      `OR(SEARCH(LOWER('${escaped}'), LOWER({title})), SEARCH(LOWER('${escaped}'), LOWER({summary})), SEARCH(LOWER('${escaped}'), LOWER({content})))`
    );
  }

  const filterByFormula = filters.length ? filters.join(" AND ") : undefined;

  const sortSpec =
    sort === "fetchedAt"
      ? [{ field: "fetchedAt", direction: order }]
      : [{ field: "publishedAt", direction: order }];

  const offset = (page - 1) * limit;

  const listOptions: any = {
    sort: sortSpec,
    pageSize: limit,
    offset
  };
  if (filterByFormula) listOptions.filterByFormula = filterByFormula;

  const allRecords = await table
    .select(listOptions)
    .all();

  const countOptions: any = { maxRecords: 1 };
  if (filterByFormula) countOptions.filterByFormula = filterByFormula;

  const total = await table
    .select(countOptions)
    .all()
    .then((r) => r.length);

  return {
    records: allRecords,
    total,
    page,
    limit,
    hasMore: allRecords.length === limit
  };
}

export async function getStats() {
  const table = getTable();
  const all = await table.select({ maxRecords: 1000 }).all();

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
  const all = await table.select({ maxRecords: 1000 }).all();
  const cats = new Set<string>();
  for (const r of all) {
    const c = (r.fields as any).category;
    if (c) cats.add(c);
  }
  return Array.from(cats).sort();
}