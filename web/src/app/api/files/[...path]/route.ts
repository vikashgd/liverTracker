import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrl } from '@/lib/storage/gcs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await params in Next.js 15
    const { path } = await params;
    
    // Reconstruct the full object key from the path segments
    const objectKey = decodeURIComponent(path.join('/'));
    
    if (!objectKey) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    // Get a signed URL for the file
    const signedUrl = await getSignedUrl(objectKey);
    
    if (!signedUrl) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Fetch the file content and proxy it instead of redirecting
    // This fixes iframe embedding issues with PDF preview
    const fileResponse = await fetch(signedUrl);
    
    if (!fileResponse.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get the file content
    const fileBuffer = await fileResponse.arrayBuffer();
    
    // Determine content type
    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
    
    // Create response with proper headers for iframe embedding
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.byteLength.toString(),
        // Allow iframe embedding
        'X-Frame-Options': 'SAMEORIGIN',
        // Enable CORS for cross-origin requests
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        // Cache for better performance
        'Cache-Control': 'public, max-age=3600',
      },
    });

    return response;
    
  } catch (error) {
    console.error('Error serving file:', error);
    
    // Check if it's a "File not found" error
    if (error instanceof Error && error.message.includes('File not found')) {
      return NextResponse.json(
        { error: 'File not found', message: 'The requested file no longer exists in storage' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}

// Add HEAD method support for file existence checks
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const objectKey = decodeURIComponent(path.join('/'));
    
    if (!objectKey) {
      return new NextResponse(null, { status: 400 });
    }

    const signedUrl = await getSignedUrl(objectKey);
    
    if (!signedUrl) {
      return new NextResponse(null, { status: 404 });
    }

    // Check if file exists
    const fileResponse = await fetch(signedUrl, { method: 'HEAD' });
    
    if (!fileResponse.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
    const contentLength = fileResponse.headers.get('content-length') || '0';

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': contentLength,
        'X-Frame-Options': 'SAMEORIGIN',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('Error checking file:', error);
    return new NextResponse(null, { status: 500 });
  }
}