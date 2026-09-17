import { NextRequest, NextResponse } from "next/server";
import { updateArticle, getTable } from "@/lib/airtable";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const table = getTable();
    const record = await table.find(params.id);
    return NextResponse.json({ success: true, data: { id: record.id, ...record.fields } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { ...fields } = body;
    await updateArticle(params.id, fields);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}