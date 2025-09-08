/**
 * Individual Share Link Management API
 * Handles operations on specific share links (update, delete, extend)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { ShareLinkService } from '@/lib/medical-sharing/share-link-service';
import { z } from 'zod';

// Validation schema for share link updates
const UpdateShareLinkSchema = z.object({
  action: z.enum(['revoke', 'extend']),
  additionalDays: z.number().min(1).max(30).optional(),
});

/**
 * PUT /api/share-links/[id] - Update a share link (revoke or extend)
 */
export async function PUT(
  req: NextRequest,
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

    // Parse and validate request body
    const body = await req.json();
    const validatedData = UpdateShareLinkSchema.parse(body);

    if (validatedData.action === 'revoke') {
      // Revoke the share link
      await ShareLinkService.revokeShareLink(userId, linkId);
      
      return NextResponse.json({
        success: true,
        message: 'Share link revoked successfully'
      });

    } else if (validatedData.action === 'extend') {
      // Extend the share link expiry
      if (!validatedData.additionalDays) {
        return NextResponse.json(
          { error: 'additionalDays is required for extend action' },
          { status: 400 }
        );
      }

      await ShareLinkService.extendExpiry(userId, linkId, validatedData.additionalDays);
      
      return NextResponse.json({
        success: true,
        message: `Share link extended by ${validatedData.additionalDays} days`
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating share link:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    // Handle service errors
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update share link' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/share-links/[id] - Delete (revoke) a share link
 */
export async function DELETE(
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

    // Revoke the share link
    await ShareLinkService.revokeShareLink(userId, linkId);

    return NextResponse.json({
      success: true,
      message: 'Share link deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting share link:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete share link' },
      { status: 500 }
    );
  }
}

