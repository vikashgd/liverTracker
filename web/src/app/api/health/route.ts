import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db-utils";

export async function GET() {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbHealth,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}