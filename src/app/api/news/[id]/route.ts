import { NextRequest, NextResponse } from "next/server";
import { updateArticle } from "@/lib/airtable";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { recordId, ...fields } = body;
    if (!recordId) return NextResponse.json({ success: false, error: "recordId required" }, { status: 400 });

    await updateArticle(recordId, fields);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}