import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { DataCorruptionFixer } from "@/lib/data-corruption-fixer";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action } = await req.json();
    
    if (action === 'analyze') {
      // Just analyze, don't fix
      const analysis = await DataCorruptionFixer.analyzeCorruption(userId);
      return NextResponse.json(analysis);
      
    } else if (action === 'fix') {
      // Analyze and apply fixes
      const result = await DataCorruptionFixer.cleanupUserData(userId);
      return NextResponse.json(result);
      
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'analyze' or 'fix'" }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Data corruption fix error:', error);
    return NextResponse.json({ 
      error: "Internal server error", 
      detail: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
