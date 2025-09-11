import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  try {
    // Instead of serving the worker file directly, redirect to CDN
    // This is more reliable and avoids bundling large files
    const cdnWorkerUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.worker.min.mjs";
    
    // Fetch the worker from CDN and serve it
    const response = await fetch(cdnWorkerUrl);
    if (!response.ok) {
      throw new Error(`CDN fetch failed: ${response.status}`);
    }
    
    const workerCode = await response.text();
    
    return new NextResponse(workerCode, { 
      headers: { 
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "public, max-age=86400" // Cache for 24 hours
      } 
    });
  } catch (e) {
    console.error('PDF.js worker error:', e);
    
    // Fallback: return a minimal worker that disables worker functionality
    const fallbackWorker = `
      // Fallback PDF.js worker - disables worker functionality
      self.onmessage = function(e) {
        self.postMessage({
          type: 'error',
          error: 'Worker functionality disabled'
        });
      };
    `;
    
    return new NextResponse(fallbackWorker, { 
      headers: { 
        "content-type": "application/javascript; charset=utf-8" 
      } 
    });
  }
}


