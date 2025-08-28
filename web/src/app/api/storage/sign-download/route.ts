import { NextRequest, NextResponse } from "next/server";
import { GCSStorage } from "@/lib/storage/gcs";

export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }
  
  try {
    const signed = await new GCSStorage().signDownloadURL({ key });
    return NextResponse.json(signed);
  } catch (error) {
    console.error('Sign download error:', error);
    
    if (error instanceof Error && error.message.includes('File not found')) {
      return NextResponse.json(
        { error: "File not found", message: "The requested file no longer exists in storage" }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to generate download URL", message: error instanceof Error ? error.message : "Unknown error" }, 
      { status: 500 }
    );
  }
}


