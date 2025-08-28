import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrl } from '@/lib/storage/gcs';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the full object key from the path segments
    const objectKey = decodeURIComponent(params.path.join('/'));
    
    if (!objectKey) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    // Get a signed URL for the file
    const signedUrl = await getSignedUrl(objectKey);
    
    if (!signedUrl) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl);
    
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}