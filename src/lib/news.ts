import crypto from "crypto";
import {
  findArticleByHash,
  findArticleByTitle,
  findArticleByURL,
  createArticle,
  listArticles
} from "./airtable";
import { NewsAPIResponse, RawNewsAPIArticle, NewsArticle, RefreshResult } from "../types";

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const CATEGORIES = ["Artificial Intelligence", "Technology", "Science", "Business"];

function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function hashArticle(title: string, url: string): string {
  return crypto
    .createHash("sha256")
    .update(normalizeTitle(title) + "|" + url)
    .digest("hex")
    .slice(0, 16);
}

function truncate(text: string | null, max = 500): string | null {
  if (!text) return null;
  return text.length > max ? text.slice(0, max) + "..." : text;
}

function simpleSummary(text: string | null, max = 200): string | null {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > max ? cleaned.slice(0, max) + "..." : cleaned;
}

function guessCategory(article: RawNewsAPIArticle): string {
  const hay = `${article.title || ""} ${article.description || ""}`.toLowerCase();
  if (/(artificial intelligence|machine learning|deep learning|neural network|llm|generative ai|gpt|openai|anthropic|gemini|copilot|ai agent|automation)/i.test(hay)) return "Artificial Intelligence";
  if (/(quantum|biology|space|physics|climate|energy|medical|research|science)/i.test(hay)) return "Science";
  if (/(startup|funding|ipo|market|economy|finance|investment|revenue)/i.test(hay)) return "Business";
  return "Technology";
}

function guessSentiment(text: string | null): "positive" | "neutral" | "negative" {
  if (!text) return "neutral";
  const t = text.toLowerCase();
  const pos = /breakthrough|advance|success|growth|innovation|improve|boost|record|win|opportunity|positive|lead|major/i;
  const neg = /risk|concern|warn|fail|crisis|drop|loss|threat|danger|negative|issue|problem|crash|lawsuit/i;
  const ps = (t.match(pos) || []).length;
  const ns = (t.match(neg) || []).length;
  if (ps > ns) return "positive";
  if (ns > ps) return "negative";
  return "neutral";
}

function guessTags(article: RawNewsAPIArticle): string[] {
  const hay = `${article.title || ""} ${article.description || ""}`.toLowerCase();
  const tagMap: [RegExp, string][] = [
    [/gpt|openai/, "GPT"],
    [/gemini/, "Gemini"],
    [/anthropic|claude/, "Claude"],
    [/machine learning|ml/, "Machine Learning"],
    [/deep learning/, "Deep Learning"],
    [/neural/, "Neural Networks"],
    [/robot/, "Robotics"],
    [/computer vision/, "Computer Vision"],
    [/nlp|natural language/, "NLP"],
    [/startup|funding/, "Startups"],
    [/chip|semiconductor|gpu/, "Semiconductors"],
    [/cloud/, "Cloud"],
    [/cybersecurity|security/, "Cybersecurity"],
    [/autonomous|self-driving/, "Autonomous"],
    [/health|medical|drug/, "Healthcare"],
  ];
  const tags: string[] = [];
  for (const [re, tag] of tagMap) if (re.test(hay) && !tags.includes(tag)) tags.push(tag);
  return tags.slice(0, 6);
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function guessSubcategory(article: RawNewsAPIArticle, category: string): string {
  const hay = `${article.title || ""} ${article.description || ""}`.toLowerCase();
  if (category === "Artificial Intelligence") {
    if (/robot|autonomous/i.test(hay)) return "Robotics";
    if (/vision|image|video/i.test(hay)) return "Computer Vision";
    if (/nlp|language|translation/i.test(hay)) return "NLP";
    if (/chip|semiconductor|gpu|hardware/i.test(hay)) return "Hardware";
    return "Machine Learning";
  }
  if (category === "Science") {
    if (/space|planet|nasa/i.test(hay)) return "Space";
    if (/climate|weather|environment/i.test(hay)) return "Climate";
    if (/medical|drug|health|patient/i.test(hay)) return "Medical";
    return "Research";
  }
  if (category === "Business") {
    if (/startup|funding|venture/i.test(hay)) return "Startups";
    if (/market|stock|trading/i.test(hay)) return "Markets";
    return "Finance";
  }
  return "General";
}

async function fetchFromNewsAPI(category?: string): Promise<RawNewsAPIArticle[]> {
  if (!NEWSAPI_KEY) throw new Error("NEWSAPI_KEY not configured");

  const queries = category
    ? [category]
    : ["artificial intelligence", "machine learning", "AI technology", "LLM", "generative AI"];

  const seen = new Set<string>();
  const articles: RawNewsAPIArticle[] = [];

  for (const q of queries) {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=40&apiKey=${NEWSAPI_KEY}`;
    try {
      const res = await fetch(url, { next: { revalidate: 0 } });
      if (!res.ok) continue;
      const data: NewsAPIResponse = await res.json();
      for (const a of data.articles || []) {
        if (!a.url || !a.title) continue;
        if (seen.has(a.url)) continue;
        seen.add(a.url);
        articles.push(a);
      }
    } catch {
      // ignore individual query failures
    }
  }

  return articles.slice(0, 60);
}

export async function refreshNews(): Promise<RefreshResult> {
  const articles = await fetchFromNewsAPI();
  let newCount = 0;
  let updatedCount = 0;
  let duplicatesSkipped = 0;

  for (const raw of articles) {
    const title = raw.title!.trim();
    const url = raw.url!.trim();
    const hash = hashArticle(title, url);

    // duplicate detection by hash, title, and url
    const [byHash, byTitle, byURL] = await Promise.all([
      findArticleByHash(hash),
      findArticleByTitle(title),
      findArticleByURL(url)
    ]);
    const existing = byHash || byTitle || byURL;
    if (existing) {
      duplicatesSkipped++;
      continue;
    }

    const category = guessCategory(raw);
    const description = truncate(raw.description);
    const content = truncate(raw.content, 800);
    const summary = simpleSummary(raw.content || raw.description);
    const sentiment = guessSentiment(`${title} ${description || ""}`);
    const tags = guessTags(raw);

    await createArticle({
      title,
      content,
      url,
      thumbnailUrl: raw.urlToImage,
      sourceName: raw.source?.name || "Unknown",
      sourceDomain: extractDomain(url),
      author: raw.author,
      publishedAt: raw.publishedAt || new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      category,
      subcategory: guessSubcategory(raw, category),
      summary,
      sentiment,
      tags,
      hash,
      language: "en",
      trendingScore: 0,
      duplicateGroupId: null,
      relatedArticleIds: [],
      updatedAt: new Date().toISOString()
    });
    newCount++;
  }

  return {
    fetched: articles.length,
    new: newCount,
    updated: updatedCount,
    duplicatesSkipped,
    lastRefreshed: new Date().toISOString()
  };
}

export async function searchArticles(query: string, limit = 10) {
  const { records } = await listArticles({ search: query, limit });
  return records;
}