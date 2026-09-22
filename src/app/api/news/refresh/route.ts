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
  // Manual refresh from UI — no secret required
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