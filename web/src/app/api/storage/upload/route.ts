import { NextRequest, NextResponse } from "next/server";
import { GCSStorage } from "@/lib/storage/gcs";

export const runtime = "nodejs"; // ensure Node runtime (not edge) for Buffer

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "application/octet-stream";
    const key = new URL(req.url).searchParams.get("key");
    if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });
    const arrayBuffer = await req.arrayBuffer();
    const storage = new GCSStorage();
    await storage.putObject(key, arrayBuffer, contentType);
    return NextResponse.json({ ok: true, key });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "upload_failed", detail: message }, { status: 500 });
  }
}


