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

    // CRITICAL: Fresh Prisma client
    const prisma = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    try {
      // CRITICAL: Verify user exists
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });

      if (!userExists) {
        console.log('❌ Chart Data API: User not found:', userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Return empty data for now - no cross-contamination possible
      const emptyResponse = {
        data: [],
        metric: metric,
        userId: userId
      };

      console.log(`✅ Chart Data API: Returning empty data for user ${userId}`);

      return NextResponse.json(emptyResponse, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'X-User-ID': userId,
          'X-Metric': metric || 'none'
        }
      });

    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error('❌ Chart Data API: Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}