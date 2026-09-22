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

function guessCategory(article: RawNewsAPIArticle): string | null {
  const hay = `${article.title || ""} ${article.description || ""}`.toLowerCase();

  // Must mention a specific AI tool / product / company
  const tool = /(make\b|n8n|copilot|github copilot|microsoft copilot|chatgpt|gpt-4|gpt-5|gpt4|gpt5|openai|anthropic|claude|gemini|google gemini|deepseek|perplexity|midjourney|dall-e|stable diffusion|runway|pika|sora|kling|hugging ?face|replicate|langchain|llama|mistral|phi-|granite|command r|nvidia|intel|amd|qualcomm|apple silicon|microsoft|google|amazon|meta|aws|azure|gcp)/i;
  if (!tool.test(hay)) return null;

  // Must be a release / launch / update / version / feature announcement
  const release = /(launch|release|update|version|introduces?|announces?|ships?|adds?|now available|new feature|new model|new version|v\d|beta|preview|roll out|rollout|unveil|reveal|debut|release date|available now|is live|goes live|goes general|general availability|ga\b)/i;
  if (!release.test(hay)) return null;

  return "Artificial Intelligence";
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
  if (!NEWSAPI_KEY) throw new Error("NEWSAPI_KEY not configured");

  const queries = category
    ? [category]
    : ["AI tool launch", "AI model release", "ChatGPT update", "Claude new version", "Gemini release", "Copilot new feature", "LLM update", "AI agent launch", "generative AI release", "OpenAI announcement", "Anthropic update", "AI software release"];

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

  return articles.slice(0, 20);
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

    // duplicate detection by hash and url (News table)
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
    // Skip non-AI-tool articles
    if (!category) {
      duplicatesSkipped++;
      continue;
    }

    const description = truncate(raw.description);
    const content = truncate(raw.content, 800);
    const summary = simpleSummary(raw.content || raw.description);
    const sentiment = guessSentiment(`${title} ${description || ""}`);

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
  }

  return {
    fetched: articles.length,
    new: newCount,
    updated: updatedCount,
    duplicatesSkipped,
    lastRefreshed: new Date().toISOString()
  };
}

export async function refreshArticles(): Promise<RefreshResult> {
  const articles = await fetchArticlesFromNewsAPI();
  const existingTags = await getExistingTags();
  let newCount = 0;
  let updatedCount = 0;
  let duplicatesSkipped = 0;

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

    await createArticle({
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
    }, existingTags);
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

async function fetchArticlesFromNewsAPI(): Promise<RawNewsAPIArticle[]> {
  if (!NEWSAPI_KEY) throw new Error("NEWSAPI_KEY not configured");

  const queries = ["artificial intelligence", "machine learning", "AI technology", "LLM", "generative AI"];

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

  return articles.slice(0, 20);
}

export async function searchArticles(query: string, limit = 10) {
  const { records } = await listArticles({ search: query, limit });
  return records;
}