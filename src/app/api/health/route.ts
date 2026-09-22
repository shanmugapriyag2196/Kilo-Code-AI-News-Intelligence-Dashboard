import { NextResponse } from "next/server";
import { getAirtableBase, getArticlesTable } from "@/lib/airtable";

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID ? "set" : "MISSING",
      AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY ? "set" : "MISSING",
      AIRTABLE_ARTICLES_TABLE: process.env.AIRTABLE_ARTICLES_TABLE || "Articles",
      AIRTABLE_NEWS_TABLE: process.env.AIRTABLE_NEWS_TABLE || "News",
      NEWSAPI_KEY: process.env.NEWSAPI_KEY ? "set" : "MISSING"
    }
  };

  try {
    const { base, articlesTable } = getAirtableBase();
    diagnostics.articlesTable = articlesTable;

    // Try to list a single record to test connection
    const records = await base(articlesTable).select({ maxRecords: 1 }).all();
    diagnostics.connected = true;
    diagnostics.recordCount = records.length;
    diagnostics.sampleFields = records[0]?.fields ? Object.keys(records[0].fields) : [];
    return NextResponse.json({ success: true, ...diagnostics });
  } catch (e: any) {
    diagnostics.connected = false;
    diagnostics.error = e.message;
    diagnostics.errorDetails = e.message;
    return NextResponse.json({ success: false, ...diagnostics }, { status: 500 });
  }
}