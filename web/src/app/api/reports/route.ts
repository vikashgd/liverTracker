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
  console.log('📤 Reports API POST: Starting request');
  
  try {
    // CRITICAL: Get fresh session for EVERY request
    const session = await getServerSession(authOptions);
    console.log('📤 Reports API POST: Session check', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userEmail: session?.user?.email 
    });

    if (!session?.user?.id) {
      console.log('❌ Reports API POST: No valid session');
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
    console.log('✅ Reports API POST: Authenticated user:', userId);

    // Parse request body
    const body = await request.json();
    const { objectKey, contentType, reportDate, extracted } = body;

    console.log('📤 Reports API POST: Request data', {
      objectKey,
      contentType,
      hasReportDate: !!reportDate,
      hasExtracted: !!extracted
    });

    if (!objectKey) {
      return NextResponse.json({ error: 'Missing objectKey' }, { status: 400 });
    }

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
      // CRITICAL: Double-check user exists
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true }
      });

      if (!userExists) {
        console.log('❌ Reports API POST: User not found in database:', userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      console.log('✅ Reports API POST: User verified:', userExists.email);

      // Create report file record
      const reportFile = await prisma.reportFile.create({
        data: {
          userId: userId,
          objectKey: objectKey,
          contentType: contentType || 'application/octet-stream',
          reportDate: reportDate ? new Date(reportDate) : null,
          reportType: extracted?.reportType || null
        }
      });

      console.log('✅ Reports API POST: Created report file:', reportFile.id);

      // If extracted data exists, save metrics
      if (extracted && extracted.metricsAll && Array.isArray(extracted.metricsAll)) {
        const metrics = extracted.metricsAll.map((metric: any) => ({
          reportId: reportFile.id, // Fixed: use reportId not reportFileId
          name: metric.name || 'unknown',
          value: metric.value ? parseFloat(metric.value.toString()) : null, // Fixed: convert to Float
          textValue: metric.value?.toString() || '', // Store original text value
          unit: metric.unit || null,
          category: metric.category || 'general'
        }));

        if (metrics.length > 0) {
          await prisma.extractedMetric.createMany({
            data: metrics
          });
          console.log(`✅ Reports API POST: Created ${metrics.length} metrics`);
        }
      }

      console.log('✅ Reports API POST: Successfully created report');

      return NextResponse.json({ 
        id: reportFile.id,
        objectKey: reportFile.objectKey,
        success: true 
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-User-ID': userId
        }
      });

    } finally {
      // CRITICAL: Always disconnect Prisma client
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error('❌ Reports API POST: Critical error:', error);
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