import { NextRequest, NextResponse } from "next/server";
import { refreshNews } from "@/lib/news";
import { getStats } from "@/lib/airtable";

export async function GET(req: NextRequest) {
  try {
    const result = await refreshNews();
    const stats = await getStats();
    return NextResponse.json({ success: true, data: result, stats });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      error: e.message,
      details: process.env.NODE_ENV === "development" ? e.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const result = await refreshNews();
    const stats = await getStats();
    return NextResponse.json({
      success: true,
      data: result,
      stats,
      env: {
        NEWSAPI_KEY: process.env.NEWSAPI_KEY ? "set" : "MISSING",
        AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID ? "set" : "MISSING",
        AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY ? "set" : "MISSING",
        AIRTABLE_NEWS_TABLE: process.env.AIRTABLE_NEWS_TABLE || "News"
      }
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      error: e.message,
      details: process.env.NODE_ENV === "development" ? e.stack : undefined,
      env: {
        NEWSAPI_KEY: process.env.NEWSAPI_KEY ? "set" : "MISSING",
        AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID ? "set" : "MISSING",
        AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY ? "set" : "MISSING",
        AIRTABLE_NEWS_TABLE: process.env.AIRTABLE_NEWS_TABLE || "News"
      }
    }, { status: 500 });
  }
}