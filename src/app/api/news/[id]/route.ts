import { NextResponse } from "next/server";
import { getTable } from "@/lib/airtable";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  try {
    const table = getTable();
    const record = await table.find(params.id);
    const fields = (record as any).fields || {};
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: (record as any).id,
          ...fields
        }
      }),
      { status: 200, headers }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: e?.message || "Failed to fetch article"
      }),
      { status: 404, headers }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  try {
    const { updateArticle } = await import("@/lib/airtable");
    const body = await req.json();
    const { ...fields } = body;
    await updateArticle(params.id, fields);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (e: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: e?.message || "Failed to update article"
      }),
      { status: 500, headers }
    );
  }
}