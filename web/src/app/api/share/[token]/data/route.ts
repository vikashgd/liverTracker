/**
 * Shared Medical Data API
 * Serves medical data for valid share links (no authentication required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ShareLinkService } from '@/lib/medical-sharing/share-link-service';
import { MedicalDataAggregator } from '@/lib/medical-sharing/medical-data-aggregator';
import { z } from 'zod';

// Validation schema for data access
const DataAccessSchema = z.object({
  password: z.string().optional(),
  email: z.string().email().optional(),
});

/**
 * POST /api/share/[token]/data - Get medical data for a valid share link
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = DataAccessSchema.parse(body);

    // Validate access to the share link
    const validation = await ShareLinkService.validateAccess(
      token, 
      validatedData.password, 
      validatedData.email
    );

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
        requiresPassword: validation.requiresPassword || false
      }, { status: 403 });
    }

    const shareInfo = validation.shareLink!;

    // Log the data access
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await ShareLinkService.logAccess(token, {
      ipAddress: clientIP,
      userAgent,
      timestamp: new Date(),
      actionsPerformed: { 
        action: 'data_access',
        shareType: shareInfo.shareType,
        contentAccessed: {
          profile: shareInfo.includeProfile,
          dashboard: shareInfo.includeDashboard,
          scoring: shareInfo.includeScoring,
          ai: shareInfo.includeAI,
          files: shareInfo.includeFiles
        }
      }
    });

    // Aggregate comprehensive medical data
    const aggregator = new MedicalDataAggregator();
    
    const medicalData = await aggregator.aggregateForSharing(shareInfo.userId, shareInfo);

    return NextResponse.json({
      success: true,
      medicalData,
      shareInfo: {
        title: shareInfo.title,
        description: shareInfo.description,
        shareType: shareInfo.shareType,
        expiresAt: shareInfo.expiresAt,
        generatedAt: shareInfo.createdAt
      }
    });

  } catch (error) {
    console.error('Error serving medical data:', error);

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

    return NextResponse.json(
      { error: 'Failed to serve medical data' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/share/[token]/data - Get medical data with query parameters (for simple access)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const password = searchParams.get('password') || undefined;
    const email = searchParams.get('email') || undefined;

    // Validate access to the share link
    const validation = await ShareLinkService.validateAccess(token, password, email);

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
        requiresPassword: validation.requiresPassword || false
      }, { status: 403 });
    }

    const shareInfo = validation.shareLink!;

    // Log the data access
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await ShareLinkService.logAccess(token, {
      ipAddress: clientIP,
      userAgent,
      timestamp: new Date(),
      actionsPerformed: { 
        action: 'data_access_get',
        shareType: shareInfo.shareType
      }
    });

    // Return basic share info for GET requests
    return NextResponse.json({
      success: true,
      shareInfo: {
        title: shareInfo.title,
        description: shareInfo.description,
        shareType: shareInfo.shareType,
        expiresAt: shareInfo.expiresAt,
        generatedAt: shareInfo.createdAt,
        contentIncludes: {
          profile: shareInfo.includeProfile,
          dashboard: shareInfo.includeDashboard,
          scoring: shareInfo.includeScoring,
          ai: shareInfo.includeAI,
          files: shareInfo.includeFiles
        }
      },
      message: 'Use POST request to get full medical data'
    });

  } catch (error) {
    console.error('Error accessing shared data:', error);

    return NextResponse.json(
      { error: 'Failed to access shared data' },
      { status: 500 }
    );
  }
}