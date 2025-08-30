import { NextResponse } from "next/server";
import { warmupDatabase } from "@/lib/db-fast";

export async function GET() {
  try {
    await warmupDatabase();
    return NextResponse.json({ status: "Database warmed up successfully" });
  } catch (error) {
    console.error('Warmup failed:', error);
    return NextResponse.json(
      { error: "Warmup failed" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';