/**
 * Atomic Onboarding Completion Service
 * Single source of truth for onboarding completion logic
 * Prevents race conditions and inconsistent states
 */

import { prisma } from '@/lib/db';
import { withDatabaseWarmup } from '@/lib/db-warmup';

interface OnboardingCompletionResult {
  isComplete: boolean;
  needsUpdate: boolean;
  profileComplete: boolean;
  hasReports: boolean;
  reportCount: number;
  currentFlags: {
    onboardingCompleted: boolean;
    profileCompleted: boolean;
    firstReportUploaded: boolean;
  };
}

/**
 * Single atomic check for onboarding completion
 * This is the ONLY function that should determine completion status
 */
export async function checkAndUpdateOnboardingCompletion(userId: string): Promise<OnboardingCompletionResult> {
  return await withDatabaseWarmup(async () => {
    // Use a transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      console.log(`🔍 [ATOMIC] Checking onboarding completion for user: ${userId}`);
      
      // Get user with all required data in one query
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            select: {
              gender: true,
              height: true,
              weight: true,
            }
          },
          reportFiles: {
            select: { id: true }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check actual completion requirements
      const profileComplete = !!(
        user.profile?.gender && 
        user.profile?.height && 
        user.profile?.weight
      );
      
      const reportCount = user.reportFiles.length;
      const hasReports = reportCount > 0;
      
      // Determine if onboarding should be complete
      const shouldBeComplete = profileComplete && hasReports;
      
      const currentFlags = {
        onboardingCompleted: user.onboardingCompleted,
        profileCompleted: user.profileCompleted,
        firstReportUploaded: user.firstReportUploaded,
      };

      console.log(`📊 [ATOMIC] Requirements - Profile: ${profileComplete}, Reports: ${hasReports} (${reportCount})`);
      console.log(`🏁 [ATOMIC] Should be complete: ${shouldBeComplete}, Currently marked: ${currentFlags.onboardingCompleted}`);

      // Check if we need to update flags
      const needsUpdate = shouldBeComplete && !currentFlags.onboardingCompleted;

      if (needsUpdate) {
        console.log('🔄 [ATOMIC] Updating onboarding flags...');
        
        await tx.user.update({
          where: { id: userId },
          data: {
            onboardingCompleted: true,
            onboardingCompletedAt: new Date(),
            onboardingStep: 'complete',
            profileCompleted: true,
            firstReportUploaded: true,
            secondReportUploaded: reportCount >= 2,
          }
        });

        console.log('✅ [ATOMIC] Onboarding flags updated successfully');
      }

      return {
        isComplete: shouldBeComplete,
        needsUpdate,
        profileComplete,
        hasReports,
        reportCount,
        currentFlags,
      };
    });
  });
}

/**
 * Simple check if user needs onboarding (for routing decisions)
 * Uses the atomic completion checker
 */
export async function userNeedsOnboarding(userId: string): Promise<boolean> {
  try {
    const result = await checkAndUpdateOnboardingCompletion(userId);
    return !result.isComplete;
  } catch (error) {
    console.error('❌ [ATOMIC] Error checking onboarding needs:', error);
    // Default to requiring onboarding on error (safer)
    return true;
  }
}

/**
 * Get onboarding status with automatic completion check
 * This replaces the old getUserOnboardingStatus function
 */
export async function getAtomicOnboardingStatus(userId: string) {
  try {
    const result = await checkAndUpdateOnboardingCompletion(userId);
    
    return {
      needsOnboarding: !result.isComplete,
      isComplete: result.isComplete,
      profileComplete: result.profileComplete,
      hasReports: result.hasReports,
      reportCount: result.reportCount,
      wasUpdated: result.needsUpdate,
    };
  } catch (error) {
    console.error('❌ [ATOMIC] Error getting onboarding status:', error);
    return {
      needsOnboarding: true,
      isComplete: false,
      profileComplete: false,
      hasReports: false,
      reportCount: 0,
      wasUpdated: false,
    };
  }
}