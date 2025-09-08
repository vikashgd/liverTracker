/**
 * Public Share Link Access API
 * Handles validation and access to shared medical data (no authentication required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ShareLinkService } from '@/lib/medical-sharing/share-link-service';
import { z } from 'zod';

// Validation schema for share access
const ShareAccessSchema = z.object({
  password: z.string().optional(),
  email: z.string().email().optional(),
});

/**
 * GET /api/share/[token] - Validate and get share link information
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
      // Handle different error types
      const statusCode = validation.requiresPassword ? 200 : 403;
      
      return NextResponse.json({
        success: false,
        error: validation.error,
        requiresPassword: validation.requiresPassword || false
      }, { status: statusCode });
    }

    // Log the access attempt
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await ShareLinkService.logAccess(token, {
      ipAddress: clientIP,
      userAgent,
      timestamp: new Date(),
      actionsPerformed: { action: 'view_info' }
    });

    return NextResponse.json({
      success: true,
      shareInfo: validation.shareLink
    });

  } catch (error) {
    console.error('Error accessing share link:', error);

    return NextResponse.json(
      { error: 'Failed to access share link' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/share/[token] - Validate password and get share link access
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
    const validatedData = ShareAccessSchema.parse(body);

    // Validate access with provided credentials
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

    // Log the successful access
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await ShareLinkService.logAccess(token, {
      ipAddress: clientIP,
      userAgent,
      timestamp: new Date(),
      actionsPerformed: { 
        action: 'authenticated_access',
        passwordUsed: !!validatedData.password,
        emailUsed: !!validatedData.email
      }
    });

    return NextResponse.json({
      success: true,
      shareInfo: validation.shareLink,
      message: 'Access granted'
    });

  } catch (error) {
    console.error('Error validating share access:', error);

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
      { error: 'Failed to validate access' },
      { status: 500 }
    );
  }
}