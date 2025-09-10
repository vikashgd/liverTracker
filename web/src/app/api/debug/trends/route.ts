import { NextRequest, NextResponse } from 'next/server';
import { MedicalDataAggregator } from '@/lib/medical-sharing/medical-data-aggregator';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        reportFiles: {
          include: {
            metrics: true
          },
          take: 5
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Test the aggregator
    const aggregator = new MedicalDataAggregator();
    const shareConfig = {
      id: 'debug',
      token: 'debug',
      url: '/debug/trends',
      userId,
      shareType: 'COMPLETE_PROFILE' as const,
      title: 'Debug Test',
      description: 'Debug test',
      reportIds: user.reportFiles.map(r => r.id),
      includeProfile: true,
      includeDashboard: true,
      includeScoring: true,
      includeAI: true,
      includeFiles: true,
      expiresAt: new Date(),
      maxViews: 1,
      currentViews: 0,
      allowedEmails: [],
      isActive: true,
      createdAt: new Date(),
      lastAccessedAt: new Date()
    };

    const medicalData = await aggregator.aggregateForSharing(userId, shareConfig);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        reportCount: user.reportFiles.length,
        metricCount: user.reportFiles.reduce((sum, r) => sum + r.metrics.length, 0)
      },
      trends: {
        count: medicalData.reports.trends.length,
        data: medicalData.reports.trends
      },
      debug: {
        reportsStructure: Object.keys(medicalData.reports),
        trendsType: typeof medicalData.reports.trends,
        trendsIsArray: Array.isArray(medicalData.reports.trends)
      }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}