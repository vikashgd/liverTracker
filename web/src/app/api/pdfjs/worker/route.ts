import { NextRequest, NextResponse } from "next/server";
import { createRequire } from "module";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  try {
    const require = createRequire(import.meta.url);
    const pkgPath = require.resolve("pdfjs-dist/package.json");
    const baseDir = path.dirname(pkgPath);
    const candidates = [
      path.join(baseDir, "build/pdf.worker.min.mjs"),
      path.join(baseDir, "build/pdf.worker.min.js"),
      path.join(baseDir, "build/pdf.worker.js"),
    ];
    for (const p of candidates) {
      try {
        const text = await fs.readFile(p, { encoding: "utf-8" });
        return new NextResponse(text, { headers: { "content-type": "application/javascript; charset=utf-8" } });
      } catch {
        // try next
      }
    }
    return NextResponse.json({ error: "worker_not_found" }, { status: 500 });
  } catch (e) {
    return NextResponse.json({ error: "worker_error" }, { status: 500 });
  }
}


