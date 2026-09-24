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
  createNews,
  createTool,
  listTools,
  createTechnology,
  listTechnology
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

  // Focus on specific AI tool releases from major companies
  const queries = ["OpenAI", "ChatGPT", "Anthropic Claude", "Google Gemini", "Microsoft Copilot", "DeepSeek", "Meta AI", "Mistral", "NVIDIA AI", "Hugging Face"];

  for (const q of queries) {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWSAPI_KEY}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const txt = await res.text();
        errors.push(`${q}: HTTP ${res.status} ${txt.slice(0, 200)}`);
        continue;
      }
      const data: NewsAPIResponse = await res.json();
      if (data.status === "error") {
        errors.push(`${q}: ${data.message}`);
        continue;
      }
      for (const a of data.articles || []) {
        if (!a.url || !a.title) continue;
        if (seen.has(a.url)) continue;
        seen.add(a.url);
        articles.push(a);
      }
    } catch (e: any) {
      errors.push(`${q}: ${e.message}`);
    }
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
    errors: errors.length ? errors : undefined,
    articles
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
    errors: errors.length ? errors : undefined,
    articles
  };
}

async function fetchArticlesFromNewsAPI(): Promise<RawNewsAPIArticle[]> {
  const NEWSAPI_KEY = getNewsAPIKey();

  const seen = new Set<string>();
  const articles: RawNewsAPIArticle[] = [];

  // Focus on specific AI tool releases from major companies
  const queries = ["OpenAI", "ChatGPT", "Anthropic Claude", "Google Gemini", "Microsoft Copilot", "DeepSeek", "Meta AI", "Mistral", "NVIDIA AI", "Hugging Face"];

  for (const q of queries) {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWSAPI_KEY}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
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

export async function seedTools(articles?: RawNewsAPIArticle[]): Promise<{ seeded: number }> {
  const existing = await listTools(50);
  const existingNames = new Set(
    existing.map((r: any) => (r.fields?.name || "").toLowerCase())
  );

  const SEED_TOOLS = [
    {
      name: "Viktor",
      description:
        "An AI teammate that integrates directly into Slack or Teams, reading channel context and proactively taking work off your plate.",
      category: "AI Agent",
      releaseDate: "2026-09-22",
      url: "https://www.viktor.ai",
      icon: "🤖"
    },
    {
      name: "Granola AI",
      description:
        "A passive meeting transcription and summarization tool that records audio from your laptop locally without needing to join the virtual call.",
      category: "Productivity",
      releaseDate: "2026-09-22",
      url: "https://granola.ai",
      icon: "🎙️"
    },
    {
      name: "Google Flow",
      description:
        "An end-to-end multimedia and video generation platform capable of turning single images and text prompts into dynamic animations.",
      category: "Video Generation",
      releaseDate: "2026-09-22",
      url: "https://flow.google",
      icon: "🎬"
    },
    {
      name: "Claude Co-work",
      description:
        "An advanced desktop-automation agent built for handling long-document reasoning, file management, and repetitive tasks.",
      category: "Desktop Automation",
      releaseDate: "2026-09-22",
      url: "https://claude.ai/co-work",
      icon: "💻"
    },
    {
      name: "Lovable / Bolt",
      description:
        "Popular 'vibe-coding' platforms that let users build functional software applications purely through conversational prompts.",
      category: "No-Code",
      releaseDate: "2026-09-22",
      url: "https://lovable.dev",
      icon: "⚡"
    }
  ];

  // Extract new tool names from NewsAPI articles
  const toolPattern = /\b(OpenAI|ChatGPT|Claude|Gemini|Copilot|DeepSeek|Mistral|NVIDIA|Hugging Face|Midjourney|Stable Diffusion|Perplexity|Make|N8n|Lovable|Bolt|Granola|Viktor|Flow|Co-work)\b/gi;
  if (articles) {
    for (const a of articles) {
      const hay = `${a.title || ""} ${a.description || ""}`;
      const matches = hay.match(toolPattern);
      if (matches) {
        const unique = Array.from(new Set(matches));
        for (const m of unique) {
          const toolName = m.trim();
          if (existingNames.has(toolName.toLowerCase())) continue;
          SEED_TOOLS.push({
            name: toolName,
            description: a.description || a.title || "",
            category: "AI Tool",
            releaseDate: a.publishedAt ? new Date(a.publishedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            url: a.url || "",
            icon: "🤖"
          });
        }
      }
    }
  }

  let seeded = 0;
  for (const tool of SEED_TOOLS) {
    if (existingNames.has(tool.name.toLowerCase())) continue;
    try {
      await createTool({ ...tool, createdAt: new Date().toISOString() });
      seeded++;
    } catch (e: any) {
      console.error(`seedTools: failed for ${tool.name}:`, e.message);
    }
  }
  return { seeded };
}

export async function seedTechnology(): Promise<{ seeded: number; errors?: string[] }> {
  const existing = await listTechnology(50);
  const existingNames = new Set(
    existing.map((r: any) => (r.fields?.Tool || "").toLowerCase())
  );

  const SEED_TECH = [
    {
      Tool: "UiPath",
      Category: "RPA",
      Update: "UiPath released its Autumn 2026 suite featuring AI-powered document understanding and expanded generative process automation for enterprise workflows.",
      Date: "2026-09-20",
      URL: "https://www.uipath.com",
      Impact: "Accelerates enterprise automation with native AI document processing"
    },
    {
      Tool: "Automation Anywhere",
      Category: "RPA",
      Update: "Automation Anywhere launched a cloud-native bot store with pre-built AI automation packs for finance and HR departments.",
      Date: "2026-09-18",
      URL: "https://www.automationanywhere.com",
      Impact: "Reduces RPA setup time with ready-made automation components"
    },
    {
      Tool: "Blue Prism",
      Category: "RPA",
      Update: "Blue Prism introduced an intelligent digital workforce with real-time sentiment analysis and self-learning process models.",
      Date: "2026-09-15",
      URL: "https://www.blueprism.com",
      Impact: "Enables autonomous process correction without manual retraining"
    },
    {
      Tool: "Make.com",
      Category: "Automation",
      Update: "Make.com rolled out AI scenario templates and a visual scenario editor that connects over 1,000 apps with no-code automation.",
      Date: "2026-09-21",
      URL: "https://www.make.com",
      Impact: "Allows non-developers to build multi-step AI workflows visually"
    },
    {
      Tool: "N8N",
      Category: "Automation",
      Update: "N8N shipped a self-hosted AI workflow engine with custom node support, enabling teams to run proprietary automation pipelines on their own infrastructure.",
      Date: "2026-09-19",
      URL: "https://n8n.io",
      Impact: "Provides data sovereignty for automation with extensible node framework"
    },
    {
      Tool: "Zapier",
      Category: "Automation",
      Update: "Zapier added AI Actions that let workflows generate content, summarize data, and make decisions using large language models across 5,000+ integrations.",
      Date: "2026-09-17",
      URL: "https://zapier.com",
      Impact: "Brings generative AI into existing no-code automation recipes"
    },
    {
      Tool: "Power BI",
      Category: "BI",
      Update: "Microsoft Power BI introduced AI-powered insights, natural language Q&A, and auto-generated forecasting models for enterprise dashboards.",
      Date: "2026-09-22",
      URL: "https://www.microsoft.com/en-us/power-platform/products/power-bi",
      Impact: "Lets business users query data in plain English with automatic trend forecasting"
    },
    {
      Tool: "Tableau",
      Category: "BI",
      Update: "Tableau released AI-driven data storytelling and anomaly detection, highlighting unexpected trends across enterprise data sources.",
      Date: "2026-09-14",
      URL: "https://www.tableau.com",
      Impact: "Surfaces anomalies automatically to reduce manual data inspection"
    },
    {
      Tool: "Looker Studio",
      Category: "BI",
      Update: "Looker Studio added machine learning forecasts and semantic data modeling, letting teams build consistent metrics across reports.",
      Date: "2026-09-12",
      URL: "https://lookerstudio.google.com",
      Impact: "Unifies metric definitions and adds predictive analytics to reports"
    }
  ];

  let seeded = 0;
  const errors: string[] = [];
  for (const tech of SEED_TECH) {
    if (existingNames.has(tech.Tool.toLowerCase())) continue;
    try {
      await createTechnology({ ...tech });
      seeded++;
    } catch (e: any) {
      errors.push(`${tech.Tool}: ${e.message}`);
    }
  }
  return { seeded, errors: errors.length ? errors : undefined };
}