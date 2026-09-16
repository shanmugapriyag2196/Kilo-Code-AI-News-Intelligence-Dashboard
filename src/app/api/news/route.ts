import { NextRequest, NextResponse } from "next/server";
import { listArticles, getStats, getDistinctCategories } from "@/lib/airtable";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;
  const isFavorite = searchParams.get("isFavorite");
  const isRead = searchParams.get("isRead");
  const sentiment = searchParams.get("sentiment") || undefined;
  const sort = (searchParams.get("sort") as any) || "publishedAt";
  const order = (searchParams.get("order") as any) || "desc";

  try {
    const { records, total } = await listArticles({
      page,
      limit,
      category,
      search,
      isFavorite: isFavorite === "true" ? true : isFavorite === "false" ? false : undefined,
      isRead: isRead === "true" ? true : isRead === "false" ? false : undefined,
      sentiment,
      sort,
      order
    });

    const stats = await getStats();
    const categories = await getDistinctCategories();

    return NextResponse.json({
      success: true,
      data: records,
      meta: { total, page, limit, lastRefreshed: stats.lastRefreshed },
      stats,
      categories
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}