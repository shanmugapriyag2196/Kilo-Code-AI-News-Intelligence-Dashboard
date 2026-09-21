import { NextRequest, NextResponse } from "next/server";
import { getTable } from "@/lib/airtable";

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const dateFilter = url.searchParams.get("dateFilter") || "all";

    const table = getTable();

    // Fetch all records
    let allRecords: any[] = [];
    let offset: string | null = null;
    do {
      const pageOptions: any = { pageSize: 100 };
      if (offset) pageOptions.offset = offset;
      const pageRecords = await table.select(pageOptions).all();
      allRecords = allRecords.concat(pageRecords);
      offset = (pageRecords as any).offset || null;
    } while (offset);

    // Filter by date
    let toDelete: any[] = [];
    if (dateFilter === "all") {
      toDelete = allRecords;
    } else {
      const now = new Date();
      let startDate: Date;
      let endDate: Date | null = null;
      if (dateFilter === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateFilter === "yesterday") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateFilter === "week") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(0);
      }
      const startMs = startDate.getTime();
      const endMs = endDate ? endDate.getTime() : Infinity;
      toDelete = allRecords.filter((r: any) => {
        const pub = r.fields?.publishedAt;
        if (!pub) return false;
        const pubDate = new Date(pub).getTime();
        return !isNaN(pubDate) && pubDate >= startMs && pubDate < endMs;
      });
    }

    // Delete in batches of 10
    let deleted = 0;
    for (let i = 0; i < toDelete.length; i += 10) {
      const batch = toDelete.slice(i, i + 10);
      await table.destroy(batch.map((r: any) => r.id));
      deleted += batch.length;
    }

    return NextResponse.json({
      success: true,
      data: { deleted, total: allRecords.length }
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      error: e.message
    }, { status: 500 });
  }
}