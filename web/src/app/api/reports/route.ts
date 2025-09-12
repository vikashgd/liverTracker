import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { PrismaClient } from '../../../generated/prisma';

export async function GET(request: NextRequest) {
  console.log('🔍 Reports API: Starting request');
  
  try {
    // CRITICAL: Get fresh session for EVERY request
    const session = await getServerSession(authOptions);
    console.log('🔍 Reports API: Session check', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userEmail: session?.user?.email 
    });

    if (!session?.user?.id) {
      console.log('❌ Reports API: No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    const userId = session.user.id;
    console.log('✅ Reports API: Authenticated user:', userId);

    // CRITICAL: Use fresh Prisma client for EVERY request
    const prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    try {
      // CRITICAL: Double-check user exists and get ONLY their data
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true }
      });

      if (!userExists) {
        console.log('❌ Reports API: User not found in database:', userId);
        return NextResponse.json({ error: 'User not found' }, { 
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }

      console.log('✅ Reports API: User verified:', userExists.email);

      // CRITICAL: Get ONLY this user's report files with STRICT filtering
      const reportFiles = await prisma.reportFile.findMany({
        where: {
          userId: userId, // STRICT: Only this user's files
          // Additional safety check
          user: {
            id: userId
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`✅ Reports API: Found ${reportFiles.length} reports for user ${userId}`);

      // CRITICAL: Verify ALL returned data belongs to the requesting user
      const contaminated = reportFiles.filter(report => report.userId !== userId);
      if (contaminated.length > 0) {
        console.error('🚨 CRITICAL: Data contamination detected!', {
          requestingUser: userId,
          contaminatedReports: contaminated.map(r => ({ id: r.id, userId: r.userId }))
        });
        
        // Return empty array if contamination detected
        return NextResponse.json([], {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-User-ID': userId,
            'X-Contamination-Detected': 'true'
          }
        });
      }

      // Transform to expected format using correct ReportFile fields
      const reports = reportFiles.map(file => ({
        id: file.id,
        filename: file.objectKey, // Use objectKey as filename
        createdAt: file.createdAt,
        userId: file.userId,
        contentType: file.contentType,
        reportType: file.reportType,
        reportDate: file.reportDate,
        objectKey: file.objectKey
      }));

      console.log(`✅ Reports API: Returning ${reports.length} clean reports for user ${userId}`);

      return NextResponse.json(reports, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-User-ID': userId,
          'X-Report-Count': reports.length.toString()
        }
      });

    } finally {
      // CRITICAL: Always disconnect Prisma client
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error('❌ Reports API: Critical error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}

export async function POST(request: NextRequest) {
  // Similar strict validation for POST requests
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { 
      status: 401,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  }

  // Implementation for POST would go here with same strict validation
  return NextResponse.json({ message: 'POST not implemented yet' }, { status: 501 });
}