/**
 * Onboarding utility functions
 */

import { prisma } from '@/lib/db';
import { withDatabaseWarmup } from '@/lib/db-warmup';
import { 
  OnboardingState, 
  OnboardingStep, 
  UserOnboardingStatus,
  ONBOARDING_STEPS 
} from '@/types/onboarding';

/**
 * Get user's onboarding status from database
 */
export async function getUserOnboardingStatus(userId: string): Promise<UserOnboardingStatus | null> {
  try {
    const user = await withDatabaseWarmup(() => prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboardingCompleted: true,
        onboardingStep: true,
        profileCompleted: true,
        firstReportUploaded: true,
        secondReportUploaded: true,
        onboardingCompletedAt: true,
        _count: {
          select: {
            reportFiles: true,
          },
        },
      },
    }));

    if (!user) return null;

    return {
      onboardingCompleted: user.onboardingCompleted,
      onboardingStep: user.onboardingStep,
      profileCompleted: user.profileCompleted,
      firstReportUploaded: user.firstReportUploaded,
      secondReportUploaded: user.secondReportUploaded,
      onboardingCompletedAt: user.onboardingCompletedAt,
      reportCount: user._count.reportFiles,
    };
  } catch (error) {
    console.error('Error getting user onboarding status:', error);
    return null;
  }
}

/**
 * Determine user's current onboarding state
 */
export async function getUserOnboardingState(userId: string): Promise<OnboardingState> {
  // First, try to auto-complete onboarding if requirements are met
  const { autoCompleteOnboardingIfReady } = await import('./onboarding-auto-completion');
  await autoCompleteOnboardingIfReady(userId);
  
  const status = await getUserOnboardingStatus(userId);
  
  if (!status) {
    return {
      isNewUser: true,
      needsOnboarding: true,
      currentStep: 'welcome',
      completedSteps: [],
      progress: {
        hasProfile: false,
        reportCount: 0,
        profileCompleted: false,
        firstReportUploaded: false,
        secondReportUploaded: false,
      },
    };
  }

  const isNewUser = !status.onboardingCompleted && status.reportCount === 0;
  const needsOnboarding = !status.onboardingCompleted;
  
  // Determine current step based on progress
  let currentStep: OnboardingStep | null = null;
  const completedSteps: OnboardingStep[] = [];

  if (needsOnboarding) {
    if (!status.profileCompleted) {
      currentStep = 'profile';
    } else if (!status.firstReportUploaded) {
      currentStep = 'first-upload';
      completedSteps.push('profile');
    } else if (status.reportCount === 1) {
      currentStep = 'data-review';
      completedSteps.push('profile', 'first-upload');
    } else {
      currentStep = 'complete';
      completedSteps.push('profile', 'first-upload', 'data-review');
    }
  }

  return {
    isNewUser,
    needsOnboarding,
    currentStep,
    completedSteps,
    progress: {
      hasProfile: status.profileCompleted,
      reportCount: status.reportCount,
      profileCompleted: status.profileCompleted,
      firstReportUploaded: status.firstReportUploaded,
      secondReportUploaded: status.secondReportUploaded,
    },
  };
}

/**
 * Update user's onboarding step
 */
export async function updateOnboardingStep(
  userId: string, 
  step: OnboardingStep
): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingStep: step },
    });
    return true;
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    return false;
  }
}

/**
 * Mark profile as completed
 */
export async function markProfileCompleted(userId: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        profileCompleted: true,
        onboardingStep: 'first-upload',
      },
    });
    return true;
  } catch (error) {
    console.error('Error marking profile completed:', error);
    return false;
  }
}

/**
 * Mark first report as uploaded
 */
export async function markFirstReportUploaded(userId: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        firstReportUploaded: true,
        onboardingStep: 'data-review',
      },
    });
    return true;
  } catch (error) {
    console.error('Error marking first report uploaded:', error);
    return false;
  }
}

/**
 * Mark second report as uploaded
 */
export async function markSecondReportUploaded(userId: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        secondReportUploaded: true,
      },
    });
    return true;
  } catch (error) {
    console.error('Error marking second report uploaded:', error);
    return false;
  }
}

/**
 * Mark onboarding as complete
 */
export async function markOnboardingComplete(userId: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        onboardingCompleted: true,
        onboardingStep: 'complete',
        onboardingCompletedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error('Error marking onboarding complete:', error);
    return false;
  }
}

/**
 * Check if user needs onboarding
 */
export async function userNeedsOnboarding(userId: string): Promise<boolean> {
  const status = await getUserOnboardingStatus(userId);
  return !status?.onboardingCompleted;
}

/**
 * Get next onboarding step for user
 */
export function getNextOnboardingStep(state: OnboardingState): OnboardingStep | null {
  if (!state.needsOnboarding) return null;
  
  const allSteps = ONBOARDING_STEPS.map(s => s.id);
  const nextStepIndex = state.completedSteps.length;
  
  return nextStepIndex < allSteps.length ? allSteps[nextStepIndex] : null;
}

/**
 * Calculate onboarding progress percentage
 */
export function calculateOnboardingProgress(state: OnboardingState): number {
  if (!state.needsOnboarding) return 100;
  
  const totalSteps = ONBOARDING_STEPS.length;
  const completedSteps = state.completedSteps.length;
  
  return Math.round((completedSteps / totalSteps) * 100);
}

/**
 * Check if step is unlocked for user
 */
export function isStepUnlocked(step: OnboardingStep, state: OnboardingState): boolean {
  const stepConfig = ONBOARDING_STEPS.find(s => s.id === step);
  if (!stepConfig?.unlockRequirements) return true;
  
  const { unlockRequirements } = stepConfig;
  
  if (unlockRequirements.profileCompleted && !state.progress.profileCompleted) {
    return false;
  }
  
  if (unlockRequirements.reportCount && state.progress.reportCount < unlockRequirements.reportCount) {
    return false;
  }
  
  return true;
}