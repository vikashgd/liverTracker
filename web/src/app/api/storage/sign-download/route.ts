import { NextRequest, NextResponse } from "next/server";
import { GCSStorage } from "@/lib/storage/gcs";

export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }
  const signed = await new GCSStorage().signDownloadURL({ key });
  return NextResponse.json(signed);
}


