import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GCSStorage } from "@/lib/storage/gcs";

const Body = z.object({
  key: z.string().min(1),
  contentType: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const signed = await new GCSStorage().signUploadURL(parsed.data);
  return NextResponse.json(signed);
}


