import { NextRequest, NextResponse } from "next/server";
import { refreshNews, refreshArticles, seedTools, seedTechnology } from "@/lib/news";
import { getStats } from "@/lib/airtable";

export async function GET(req: NextRequest) {
  try {
    const newsResult = await refreshNews();
    const articlesResult = await refreshArticles();
    const toolsResult = await seedTools(articlesResult.articles);
    const technologyResult = await seedTechnology();
    const stats = await getStats();
    const key = process.env.NEWSAPI_KEY || "";
    return NextResponse.json({
      success: true,
      data: { news: newsResult, articles: articlesResult, tools: toolsResult, technology: technologyResult },
      stats,
      env: {
        NEWSAPI_KEY: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : "MISSING",
        NEWSAPI_KEY_LENGTH: key.length
      }
    });
  } catch (e: any) {
    const key = process.env.NEWSAPI_KEY || "";
    return NextResponse.json({
      success: false,
      error: e.message,
      env: {
        NEWSAPI_KEY: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : "MISSING",
        NEWSAPI_KEY_LENGTH: key.length
      }
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const newsResult = await refreshNews();
    const articlesResult = await refreshArticles();
    const toolsResult = await seedTools(articlesResult.articles);
    const technologyResult = await seedTechnology();
    const stats = await getStats();
    const key = process.env.NEWSAPI_KEY || "";
    return NextResponse.json({
      success: true,
      data: { news: newsResult, articles: articlesResult, tools: toolsResult, technology: technologyResult },
      stats,
      env: {
        NEWSAPI_KEY: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : "MISSING",
        NEWSAPI_KEY_LENGTH: key.length,
        AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID ? "set" : "MISSING",
        AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY ? "set" : "MISSING",
        AIRTABLE_NEWS_TABLE: process.env.AIRTABLE_NEWS_TABLE || "News",
        AIRTABLE_ARTICLES_TABLE: process.env.AIRTABLE_ARTICLES_TABLE || "Articles",
        AIRTABLE_TOOLS_TABLE: process.env.AIRTABLE_TOOLS_TABLE || "Tools",
        AIRTABLE_TECHNOLOGY_TABLE: process.env.AIRTABLE_TECHNOLOGY_TABLE || "Technology"
      }
    });
  } catch (e: any) {
    const key = process.env.NEWSAPI_KEY || "";
    return NextResponse.json({
      success: false,
      error: e.message,
      stack: process.env.NODE_ENV === "development" ? e.stack : undefined,
      env: {
        NEWSAPI_KEY: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : "MISSING",
        NEWSAPI_KEY_LENGTH: key.length,
        AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID ? "set" : "MISSING",
        AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY ? "set" : "MISSING",
        AIRTABLE_NEWS_TABLE: process.env.AIRTABLE_NEWS_TABLE || "News",
        AIRTABLE_ARTICLES_TABLE: process.env.AIRTABLE_ARTICLES_TABLE || "Articles",
        AIRTABLE_TOOLS_TABLE: process.env.AIRTABLE_TOOLS_TABLE || "Tools",
        AIRTABLE_TECHNOLOGY_TABLE: process.env.AIRTABLE_TECHNOLOGY_TABLE || "Technology"
      }
    }, { status: 500 });
  }
}