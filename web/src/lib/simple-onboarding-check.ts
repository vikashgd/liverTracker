/**
 * SIMPLE ONBOARDING CHECK
 * Two flags only:
 * 1. Profile exists with required fields (gender, height, weight)
 * 2. At least one report uploaded
 * If both = true, go to dashboard. Otherwise, stay in onboarding.
 */

import { prisma } from '@/lib/db';

export async function simpleOnboardingCheck(userId: string): Promise<{
  profileComplete: boolean;
  hasReports: boolean;
  shouldGoToDashboard: boolean;
}> {
  try {
    console.log(`🔍 [SIMPLE] Checking onboarding for user: ${userId}`);
    
    // Get user with profile and report count in one query
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          select: {
            gender: true,
            height: true,
            weight: true,
          }
        },
        _count: {
          select: {
            reportFiles: true,
          }
        }
      }
    });

    if (!user) {
      console.log(`❌ [SIMPLE] User not found: ${userId}`);
      return {
        profileComplete: false,
        hasReports: false,
        shouldGoToDashboard: false,
      };
    }

    // Flag 1: Profile complete (has gender, height, weight)
    const profileComplete = !!(
      user.profile?.gender && 
      user.profile?.height && 
      user.profile?.weight
    );

    // Flag 2: Has at least one report
    const hasReports = user._count.reportFiles > 0;

    // Decision: Both flags must be true
    const shouldGoToDashboard = profileComplete && hasReports;

    console.log(`📊 [SIMPLE] Results:`);
    console.log(`  - Profile complete: ${profileComplete}`);
    console.log(`  - Has reports: ${hasReports} (${user._count.reportFiles})`);
    console.log(`  - Should go to dashboard: ${shouldGoToDashboard}`);

    // If should go to dashboard but flags aren't set, update them
    if (shouldGoToDashboard && !user.onboardingCompleted) {
      console.log(`🔧 [SIMPLE] Updating onboarding flags...`);
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          profileCompleted: true,
          firstReportUploaded: true,
          secondReportUploaded: user._count.reportFiles >= 2,
        }
      });
      
      console.log(`✅ [SIMPLE] Flags updated`);
    }

    return {
      profileComplete,
      hasReports,
      shouldGoToDashboard,
    };

  } catch (error) {
    console.error(`❌ [SIMPLE] Error checking onboarding:`, error);
    
    // On error, default to requiring onboarding (safer)
    return {
      profileComplete: false,
      hasReports: false,
      shouldGoToDashboard: false,
    };
  }
}