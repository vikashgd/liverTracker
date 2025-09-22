/**
 * API endpoint to fix onboarding for current user
 * This will update onboarding flags based on actual report count
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { PrismaClient } from '../../../generated/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fix Onboarding API: Starting request');
    
    // Get current user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    
    console.log(`🔧 Fixing onboarding for user: ${userEmail} (${userId})`);

    // Use fresh Prisma client
    const prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    try {
      // Get user's current state and report count
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          onboardingCompleted: true,
          onboardingStep: true,
          profileCompleted: true,
          firstReportUploaded: true,
          secondReportUploaded: true,
          _count: {
            select: {
              reportFiles: true,
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const reportCount = user._count.reportFiles;
      
      console.log(`📊 User ${userEmail} current state:`, {
        reportCount,
        profileCompleted: user.profileCompleted,
        firstReportUploaded: user.firstReportUploaded,
        secondReportUploaded: user.secondReportUploaded,
        onboardingStep: user.onboardingStep
      });

      // Determine correct flags based on report count
      const shouldHaveFirst = reportCount >= 1;
      const shouldHaveSecond = reportCount >= 2;
      
      // Determine correct onboarding step
      let correctStep = 'profile';
      if (user.profileCompleted && reportCount >= 1) {
        correctStep = 'data-review';
      } else if (user.profileCompleted) {
        correctStep = 'first-upload';
      }

      console.log(`🎯 Correct state should be:`, {
        firstReportUploaded: shouldHaveFirst,
        secondReportUploaded: shouldHaveSecond,
        onboardingStep: correctStep
      });

      // Check if update is needed
      const needsUpdate = 
        user.firstReportUploaded !== shouldHaveFirst ||
        user.secondReportUploaded !== shouldHaveSecond ||
        user.onboardingStep !== correctStep;

      if (needsUpdate) {
        console.log(`🔧 Updating user onboarding state...`);
        
        await prisma.user.update({
          where: { id: userId },
          data: {
            firstReportUploaded: shouldHaveFirst,
            secondReportUploaded: shouldHaveSecond,
            onboardingStep: correctStep,
          },
        });

        console.log(`✅ Successfully updated onboarding state for ${userEmail}`);

        return NextResponse.json({
          success: true,
          message: 'Onboarding state fixed successfully',
          updated: {
            firstReportUploaded: shouldHaveFirst,
            secondReportUploaded: shouldHaveSecond,
            onboardingStep: correctStep,
          },
          reportCount,
        });
        
      } else {
        console.log(`✅ User onboarding state is already correct`);
        
        return NextResponse.json({
          success: true,
          message: 'Onboarding state is already correct',
          current: {
            firstReportUploaded: user.firstReportUploaded,
            secondReportUploaded: user.secondReportUploaded,
            onboardingStep: user.onboardingStep,
          },
          reportCount,
        });
      }

    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error('❌ Fix Onboarding API: Error:', error);
    return NextResponse.json(
      { error: 'Failed to fix onboarding state' }, 
      { status: 500 }
    );
  }
}