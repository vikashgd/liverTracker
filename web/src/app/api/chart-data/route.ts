import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { PrismaClient } from '../../../generated/prisma';

export async function GET(request: NextRequest) {
  console.log('📊 Chart Data API: Starting request');
  
  try {
    // CRITICAL: Fresh session check
    const session = await getServerSession(authOptions);
    console.log('📊 Chart Data API: Session check', { 
      hasSession: !!session, 
      userId: session?.user?.id 
    });

    if (!session?.user?.id) {
      console.log('❌ Chart Data API: No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      });
    }

    const userId = session.user.id;
    const url = new URL(request.url);
    const metric = url.searchParams.get('metric');

    console.log(`📊 Chart Data API: Request for metric "${metric}" by user ${userId}`);

    if (!metric) {
      console.log('❌ Chart Data API: No metric specified');
      return NextResponse.json({ error: 'Metric parameter required' }, { status: 400 });
    }

    // ✅ Use shared Prisma instance
    const { prisma } = await import('@/lib/db');

    try {
      // CRITICAL: Verify user exists
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true }
      });

      if (!userExists) {
        console.log('❌ Chart Data API: User not found:', userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      console.log(`✅ Chart Data API: User verified: ${userExists.email}`);

      // CRITICAL: Get extracted metrics with STRICT user filtering AND deduplication
      const extractedMetrics = await prisma.extractedMetric.findMany({
        where: {
          name: metric,
          report: {
            userId: userId, // STRICT: Only this user's reports
            // Additional safety check
            user: {
              id: userId
            }
          }
        },
        include: {
          report: {
            select: {
              id: true,
              userId: true,
              reportDate: true,
              createdAt: true
            }
          }
        },
        orderBy: [
          {
            report: {
              reportDate: 'asc'
            }
          },
          {
            createdAt: 'desc' // Latest record for same date
          }
        ]
      });

      // DEDUPLICATION: Remove duplicate entries for same report date
      const deduplicatedMetrics = [];
      const seenDates = new Set();
      
      for (const metric of extractedMetrics) {
        const reportDate = metric.report.reportDate?.toISOString().split('T')[0] || 
                          metric.report.createdAt.toISOString().split('T')[0];
        
        if (!seenDates.has(reportDate)) {
          seenDates.add(reportDate);
          deduplicatedMetrics.push(metric);
        }
      }
      
      console.log(`📊 Chart Data API: Deduplicated ${extractedMetrics.length} -> ${deduplicatedMetrics.length} metrics for ${metric}`);

      console.log(`📊 Chart Data API: Found ${extractedMetrics.length} metrics for ${metric}`);

      // CRITICAL: Verify ALL returned data belongs to requesting user
      const contaminated = deduplicatedMetrics.filter(m => m.report.userId !== userId);
      if (contaminated.length > 0) {
        console.error('🚨 CRITICAL: Chart data contamination detected!', {
          requestingUser: userId,
          contaminatedMetrics: contaminated.map(m => ({ 
            id: m.id, 
            reportUserId: m.report.userId 
          }))
        });
        
        // Return empty data if contamination detected
        return NextResponse.json({
          data: [],
          metric: metric,
          userId: userId,
          error: 'Data contamination detected'
        }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'X-User-ID': userId,
            'X-Contamination-Detected': 'true'
          }
        });
      }

      // Transform to chart data format
      const chartData = deduplicatedMetrics.map(metric => ({
        date: metric.report.reportDate || metric.report.createdAt,
        value: metric.value || 0,
        unit: metric.unit || '',
        reportId: metric.report.id,
        metricId: metric.id
      }));

      console.log(`✅ Chart Data API: Returning ${chartData.length} clean data points for user ${userId}`);

      const response = {
        data: chartData,
        metric: metric,
        userId: userId,
        count: chartData.length
      };

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'X-User-ID': userId,
          'X-Metric': metric,
          'X-Data-Count': chartData.length.toString()
        }
      });

    } catch (error) {
      throw error;
    }
    // ✅ No finally block needed - shared Prisma instance stays alive

  } catch (error) {
    console.error('❌ Chart Data API: Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      metric: new URL(request.url).searchParams.get('metric')
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  }
}