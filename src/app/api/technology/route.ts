export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listTechnology } from "@/lib/airtable";

export async function GET() {
  try {
    const records = await listTechnology(50);
    const data = records.map((r: any) => ({
      id: r.id,
      ...(r.fields || {})
    }));
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}