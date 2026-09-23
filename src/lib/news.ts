import crypto from "crypto";
import {
  findArticleByHash,
  findArticleByTitle,
  findArticleByURL,
  createArticle,
  getExistingTags,
  listArticles,
  findNewsByHash,
  findNewsByURL,
  createNews
} from "./airtable";
import { NewsAPIResponse, RawNewsAPIArticle, NewsArticle, RefreshResult } from "../types";

function getNewsAPIKey(): string {
  const key = process.env.NEWSAPI_KEY;
  if (!key) throw new Error("NEWSAPI_KEY not configured");
  return key;
}

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

function guessCategory(article: RawNewsAPIArticle): string | null {
  const hay = `${article.title || ""} ${article.description || ""}`.toLowerCase();

  // Reject non-IT/Software topics
  const nonTarget = /(sports|football|cricket|ipl|world cup|olympics|athlete|stadium|player|match|tournament|movie|film|bollywood|hollywood|celebrity|music|album|concert|fashion|luxury|travel|tourism|hotel|recipe|food|cuisine|cooking|restaurant|health|medical|hospital|patient|disease|cancer|vaccine|drug|pharma|fitness|wellness|agriculture|farm|crop|livestock|fishing|mining|forestry|real estate|property|house|apartment|mortgage|insurance|banking|finance|investment|stock market|trading|economy|economics|inflation|recession|unemployment|wage|salary|tax|budget|government|politics|election|senator|congress|president|vote|law|policy|regulation|military|war|weapon|defense|conflict|missile|bomb|attack|terrorist|disaster|storm|flood|earthquake|fire|wildfire|hurricane|weather|climate|temperature|rain|snow|wind|energy|oil|gas|coal|solar|wind farm|nuclear power|electricity|grid|utility|entertainment|gaming|esports|lottery|casino|gambling|religion|spiritual|god|temple|church|mosque|buddhist|hindu|muslim|christian|sikh|jain)/i;
  if (nonTarget.test(hay)) return null;

  // Must contain IT/Software/AI keywords
  const target = /(ai\b|artificial intelligence|machine learning|deep learning|neural network|llm|generative|automation|robot|software|developer|programming|api|saas|cloud|devops|cybersecurity|data science|analytics|algorithm|model|inference|training|tensor|transformer|diffusion|voice|speech|nlp|computer vision|semiconductor|chip|gpu|hardware|startup|tech|technology|digital|compute|openai|anthropic|claude|gemini|chatgpt|copilot|make\b|n8n|midjourney|stable diffusion|hugging face|replicate|langchain|deepseek|perplexity|mistral|llama|nvidia|intel|amd|qualcomm|microsoft|google|amazon|meta|aws|azure|gcp|xiaomi)/i;
  if (target.test(hay)) return "Artificial Intelligence";
  return null;
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

function guessSubcategory(article: RawNewsAPIArticle, category: string | null): string {
  const hay = `${article.title || ""} ${article.description || ""}`.toLowerCase();
  if (category === "Artificial Intelligence") {
    if (/robot|autonomous/i.test(hay)) return "Robotics";
    if (/vision|image|video/i.test(hay)) return "Computer Vision";
    if (/nlp|language|translation/i.test(hay)) return "NLP";
    if (/devops|ci\/cd|docker|kubernetes|container/i.test(hay)) return "DevOps";
    if (/cloud|aws|azure|gcp|serverless/i.test(hay)) return "Cloud";
    if (/security|cybersecurity|vulnerability|encryption/i.test(hay)) return "Cybersecurity";
    if (/data science|analytics|big data|statistics/i.test(hay)) return "Data Science";
    if (/chip|semiconductor|gpu|hardware/i.test(hay)) return "Hardware";
    return "Machine Learning";
  }
  return "Machine Learning";
}

async function fetchFromNewsAPI(category?: string): Promise<RawNewsAPIArticle[]> {
  const NEWSAPI_KEY = getNewsAPIKey();

  const seen = new Set<string>();
  const articles: RawNewsAPIArticle[] = [];
  const errors: string[] = [];

  // Use /everything with India keyword (free-tier compatible)
  const url = `https://newsapi.org/v2/everything?q=India+technology+AI&language=en&sortBy=publishedAt&pageSize=50&apiKey=${NEWSAPI_KEY}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const txt = await res.text();
      errors.push(`HTTP ${res.status}: ${txt.slice(0, 300)}`);
    } else {
      const data: NewsAPIResponse = await res.json();
      if (data.status === "error") {
        errors.push(data.message || "Unknown NewsAPI error");
      } else {
        for (const a of data.articles || []) {
          if (!a.url || !a.title) continue;
          if (seen.has(a.url)) continue;
          seen.add(a.url);
          articles.push(a);
        }
      }
    }
  } catch (e: any) {
    errors.push(e.message);
  }

  console.log("fetchFromNewsAPI", { fetched: articles.length, errors });
  return articles.slice(0, 20);
}

export async function refreshNews(): Promise<RefreshResult> {
  const articles = await fetchFromNewsAPI();
  let newCount = 0;
  let updatedCount = 0;
  let duplicatesSkipped = 0;
  const errors: string[] = [];

  for (const raw of articles) {
    const title = raw.title!.trim();
    const url = raw.url!.trim();
    const hash = hashArticle(title, url);

    const [byHash, byURL] = await Promise.all([
      findNewsByHash(hash),
      findNewsByURL(url)
    ]);
    const existing = byHash || byURL;
    if (existing) {
      duplicatesSkipped++;
      continue;
    }

    const category = guessCategory(raw);
    if (!category) {
      duplicatesSkipped++;
      continue;
    }

    const description = truncate(raw.description);
    const content = truncate(raw.content, 800);
    const summary = simpleSummary(raw.content || raw.description);
    const sentiment = guessSentiment(`${title} ${description || ""}`);

    try {
      await createNews({
        title,
        content,
        url,
        imageUrl: raw.urlToImage,
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
        hash,
        language: "en",
        trendingScore: "0",
        duplicateGroupId: null,
        relatedArticleIds: [],
        updatedAt: new Date().toISOString()
      });
      newCount++;
    } catch (e: any) {
      errors.push(`${title}: ${e.message}`);
    }
  }

  return {
    fetched: articles.length,
    new: newCount,
    updated: updatedCount,
    duplicatesSkipped,
    lastRefreshed: new Date().toISOString(),
    errors: errors.length ? errors : undefined
  };
}

export async function refreshArticles(): Promise<RefreshResult> {
  const articles = await fetchArticlesFromNewsAPI();
  const existingTags = await getExistingTags();
  let newCount = 0;
  let updatedCount = 0;
  let duplicatesSkipped = 0;
  const errors: string[] = [];

  for (const raw of articles) {
    const title = raw.title!.trim();
    const url = raw.url!.trim();
    const hash = hashArticle(title, url);

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
    if (!category) {
      duplicatesSkipped++;
      continue;
    }

    const description = truncate(raw.description);
    const content = truncate(raw.content, 800);
    const summary = simpleSummary(raw.content || raw.description);
    const sentiment = guessSentiment(`${title} ${description || ""}`);

    try {
      await createArticle({
        title,
        content,
        url,
        imageUrl: raw.urlToImage,
        sourceName: raw.source?.name || "Unknown",
        sourceDomain: extractDomain(url),
        author: raw.author,
        publishedAt: raw.publishedAt || new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        category,
        subcategory: guessSubcategory(raw, category),
        summary,
        sentiment,
        hash,
        language: "en",
        trendingScore: "0",
        duplicateGroupId: null,
        relatedArticleIds: [],
        updatedAt: new Date().toISOString()
      }, existingTags);
      newCount++;
    } catch (e: any) {
      errors.push(`${title}: ${e.message}`);
    }
  }

  return {
    fetched: articles.length,
    new: newCount,
    updated: updatedCount,
    duplicatesSkipped,
    lastRefreshed: new Date().toISOString(),
    errors: errors.length ? errors : undefined
  };
}

async function fetchArticlesFromNewsAPI(): Promise<RawNewsAPIArticle[]> {
  const NEWSAPI_KEY = getNewsAPIKey();

  const seen = new Set<string>();
  const articles: RawNewsAPIArticle[] = [];

  // Use /everything with India keyword (free-tier compatible)
  const url = `https://newsapi.org/v2/everything?q=India+technology+AI&language=en&sortBy=publishedAt&pageSize=50&apiKey=${NEWSAPI_KEY}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data: NewsAPIResponse = await res.json();
      for (const a of data.articles || []) {
        if (!a.url || !a.title) continue;
        if (seen.has(a.url)) continue;
        seen.add(a.url);
        articles.push(a);
      }
    }
  } catch {
    // ignore
  }

  return articles.slice(0, 20);
}

export async function searchArticles(query: string, limit = 10) {
  const { records } = await listArticles({ search: query, limit });
  return records;
}