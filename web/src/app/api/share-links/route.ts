/**
 * Share Links Management API
 * Handles creation and retrieval of medical data share links
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { ShareLinkService } from '@/lib/medical-sharing/share-link-service';
import type { ShareLinkConfig } from '@/types/medical-sharing';
import { z } from 'zod';

// Validation schema for share link creation
const CreateShareLinkSchema = z.object({
  shareType: z.enum(['COMPLETE_PROFILE', 'SPECIFIC_REPORTS', 'CONSULTATION_PACKAGE']),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  reportIds: z.array(z.string()).optional(),
  includeProfile: z.boolean().default(true),
  includeDashboard: z.boolean().default(true),
  includeScoring: z.boolean().default(true),
  includeAI: z.boolean().default(true),
  includeFiles: z.boolean().default(true),
  expiryDays: z.number().min(1).max(30).default(7),
  maxViews: z.number().min(1).max(1000).optional(),
  password: z.string().min(6).max(100).optional(),
  allowedEmails: z.array(z.string().email()).max(10).optional(),
});

/**
 * POST /api/share-links - Create a new share link
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = CreateShareLinkSchema.parse(body);

    // Create share link configuration
    const config: ShareLinkConfig = {
      shareType: validatedData.shareType as any,
      title: validatedData.title,
      description: validatedData.description,
      reportIds: validatedData.reportIds,
      includeProfile: validatedData.includeProfile,
      includeDashboard: validatedData.includeDashboard,
      includeScoring: validatedData.includeScoring,
      includeAI: validatedData.includeAI,
      includeFiles: validatedData.includeFiles,
      expiryDays: validatedData.expiryDays,
      maxViews: validatedData.maxViews,
      password: validatedData.password,
      allowedEmails: validatedData.allowedEmails,
    };

    // Create the share link
    const shareLink = await ShareLinkService.createShareLink(userId, config);

    return NextResponse.json({
      success: true,
      shareLink
    });

  } catch (error) {
    console.error('Error creating share link:', error);

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
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/share-links - Get all share links for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's share links
    const shareLinks = await ShareLinkService.getUserShareLinks(userId);

    return NextResponse.json({
      success: true,
      shareLinks
    });

  } catch (error) {
    console.error('Error fetching share links:', error);

    return NextResponse.json(
      { error: 'Failed to fetch share links' },
      { status: 500 }
    );
  }
}