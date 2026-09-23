import { NextResponse } from "next/server";
import { listTools } from "@/lib/airtable";

export async function GET() {
  try {
    const records = await listTools(20);
    const data = records.map((r: any) => ({
      id: r.id,
      ...(r.fields || {})
    }));
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}