/**
 * Share Link Access Logs API
 * GET /api/share-links/[id]/access-logs - Get access logs for a share link
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { ShareLinkService } from '@/lib/medical-sharing/share-link-service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: linkId } = await params;
    if (!linkId) {
      return NextResponse.json(
        { error: 'Share link ID is required' },
        { status: 400 }
      );
    }

    // Get access logs
    const accessLogs = await ShareLinkService.getAccessLogs(userId, linkId);

    return NextResponse.json({
      success: true,
      accessLogs: accessLogs || []
    });

  } catch (error) {
    console.error('Error fetching access logs:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch access logs' },
      { status: 500 }
    );
  }
}