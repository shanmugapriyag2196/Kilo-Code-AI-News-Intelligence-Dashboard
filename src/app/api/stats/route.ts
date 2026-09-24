export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getStats, getDistinctCategories } from "@/lib/airtable";

export async function GET(req: NextRequest) {
  try {
    const stats = await getStats();
    const categories = await getDistinctCategories();
    return NextResponse.json({ success: true, data: { ...stats, categories } });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      error: e.message,
      details: process.env.NODE_ENV === "development" ? e.stack : undefined
    }, { status: 500 });
  }
}