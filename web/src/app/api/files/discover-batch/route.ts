import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: JSON.parse(process.env.GCP_SA_KEY || '{}'),
});

const bucket = storage.bucket(process.env.GCS_BUCKET || 'livertrack-uploads');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timestamp = searchParams.get('timestamp');
    const primaryKey = searchParams.get('primaryKey');

    if (!timestamp) {
      return NextResponse.json({ error: 'Timestamp is required' }, { status: 400 });
    }

    console.log(`🔍 Discovering batch files for timestamp: ${timestamp}`);

    // Search for all files with this timestamp - use broader search
    const [files] = await bucket.getFiles({
      prefix: `reports/${timestamp}`,
      delimiter: ''
    });

    console.log(`📁 Found ${files.length} files with timestamp ${timestamp}`);

    // Convert to our format
    const batchFiles = files.map(file => {
      const fileName = file.name.split('/').pop() || 'unknown';
      return {
        objectKey: file.name,
        fileName: fileName,
        contentType: file.metadata.contentType || 'image/jpeg'
      };
    });

    // Sort by batch index (batch-0, batch-1, etc.)
    batchFiles.sort((a, b) => {
      const aMatch = a.fileName.match(/batch-(\d+)/);
      const bMatch = b.fileName.match(/batch-(\d+)/);
      
      if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
      }
      
      return a.fileName.localeCompare(b.fileName);
    });

    console.log(`✅ Returning ${batchFiles.length} batch files:`, batchFiles.map(f => f.fileName));

    return NextResponse.json(batchFiles);

  } catch (error) {
    console.error('❌ Error discovering batch files:', error);
    return NextResponse.json(
      { error: 'Failed to discover batch files' },
      { status: 500 }
    );
  }
}