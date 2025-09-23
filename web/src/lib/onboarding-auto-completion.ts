/**
 * Automatic Onboarding Completion Detection
 * Intelligently detects when users have completed onboarding requirements
 */

import { prisma } from '@/lib/db';
import { withDatabaseWarmup } from '@/lib/db-warmup';

interface OnboardingRequirements {
  hasProfile: boolean;
  hasReports: boolean;
  profileComplete: boolean;
  reportCount: number;
}

/**
 * Check if user meets all onboarding requirements
 */
export async function checkOnboardingRequirements(userId: string): Promise<OnboardingRequirements> {
  const user = await withDatabaseWarmup(() => prisma.user.findUnique({
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
        select: {
          id: true,
        }
      }
    }
  }));

  if (!user) {
    return {
      hasProfile: false,
      hasReports: false,
      profileComplete: false,
      reportCount: 0,
    };
  }

  const hasProfile = !!user.profile;
  const profileComplete = hasProfile && 
                         !!user.profile?.gender && 
                         !!user.profile?.height && 
                         !!user.profile?.weight;
  const reportCount = user.reportFiles.length;
  const hasReports = reportCount > 0;

  return {
    hasProfile,
    hasReports,
    profileComplete,
    reportCount,
  };
}

/**
 * Automatically complete onboarding if requirements are met
 */
export async function autoCompleteOnboardingIfReady(userId: string): Promise<boolean> {
  try {
    console.log(`🔍 Checking auto-completion for user: ${userId}`);
    
    const requirements = await checkOnboardingRequirements(userId);
    console.log('📊 Requirements check:', requirements);
    
    const shouldComplete = requirements.profileComplete && requirements.hasReports;
    
    if (!shouldComplete) {
      console.log('⏳ Requirements not met, onboarding not complete');
      return false;
    }

    // Check current onboarding status
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboardingCompleted: true,
        profileCompleted: true,
        firstReportUploaded: true,
      }
    });

    if (!currentUser) {
      console.log('❌ User not found');
      return false;
    }

    if (currentUser.onboardingCompleted) {
      console.log('✅ Onboarding already completed');
      return true;
    }

    console.log('🎯 Auto-completing onboarding...');
    
    // Update all onboarding flags
    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        onboardingStep: 'complete',
        profileCompleted: true,
        firstReportUploaded: true,
        secondReportUploaded: requirements.reportCount >= 2,
      }
    });

    console.log('✅ Onboarding auto-completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Error in auto-completion:', error);
    return false;
  }
}

/**
 * Smart onboarding state detection
 * Returns the actual onboarding state based on real data, not just flags
 */
export async function getSmartOnboardingState(userId: string) {
  const requirements = await checkOnboardingRequirements(userId);
  const needsOnboarding = !requirements.profileComplete || !requirements.hasReports;
  
  let currentStep: string;
  const completedSteps: string[] = [];

  if (!requirements.profileComplete) {
    currentStep = 'profile';
  } else if (!requirements.hasReports) {
    currentStep = 'first-upload';
    completedSteps.push('profile');
  } else {
    currentStep = 'complete';
    completedSteps.push('profile', 'first-upload');
  }

  return {
    needsOnboarding,
    currentStep,
    completedSteps,
    requirements,
  };
}