import { NextRequest, NextResponse } from "next/server";
import { listArticles, getStats, getDistinctCategories } from "@/lib/airtable";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;
  const sentiment = searchParams.get("sentiment") || undefined;
  const dateFilter = (searchParams.get("dateFilter") as any) || "all";
  const country = searchParams.get("country") || undefined;
  const sort = (searchParams.get("sort") as any) || "publishedAt";
  const order = (searchParams.get("order") as any) || "desc";

  try {
    const { records, total } = await listArticles({
      page,
      limit,
      category,
      search,
      sentiment,
      dateFilter,
      country,
      sort,
      order
    });

    // Flatten Airtable records: { id, fields: {...} } -> { id, ...fields }
    const data = records.map((r: any) => ({
      id: r.id,
      ...(r.fields || {})
    }));

    const stats = await getStats();
    const categories = await getDistinctCategories();

    return NextResponse.json({
      success: true,
      data,
      meta: { total, page, limit, lastRefreshed: stats.lastRefreshed },
      stats,
      categories
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      error: e.message,
      details: process.env.NODE_ENV === "development" ? e.stack : undefined
    }, { status: 500 });
  }
}