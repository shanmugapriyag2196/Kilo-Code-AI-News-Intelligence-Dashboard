import { NextRequest, NextResponse } from "next/server";
import { refreshNews, refreshArticles } from "@/lib/news";
import { getStats } from "@/lib/airtable";

export async function GET(req: NextRequest) {
  try {
    const newsResult = await refreshNews();
    const articlesResult = await refreshArticles();
    const stats = await getStats();
    const key = process.env.NEWSAPI_KEY || "";
    return NextResponse.json({
      success: true,
      data: { news: newsResult, articles: articlesResult },
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
    const stats = await getStats();
    const key = process.env.NEWSAPI_KEY || "";
    return NextResponse.json({
      success: true,
      data: { news: newsResult, articles: articlesResult },
      stats,
      env: {
        NEWSAPI_KEY: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : "MISSING",
        NEWSAPI_KEY_LENGTH: key.length,
        AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID ? "set" : "MISSING",
        AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY ? "set" : "MISSING",
        AIRTABLE_NEWS_TABLE: process.env.AIRTABLE_NEWS_TABLE || "News",
        AIRTABLE_ARTICLES_TABLE: process.env.AIRTABLE_ARTICLES_TABLE || "Articles"
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
        AIRTABLE_ARTICLES_TABLE: process.env.AIRTABLE_ARTICLES_TABLE || "Articles"
      }
    }, { status: 500 });
  }
}