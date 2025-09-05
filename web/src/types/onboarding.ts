/**
 * User onboarding types and interfaces
 */

export type OnboardingStep = 
  | 'welcome'
  | 'profile'
  | 'first-upload'
  | 'data-review'
  | 'complete';

export interface OnboardingState {
  isNewUser: boolean;
  needsOnboarding: boolean;
  currentStep: OnboardingStep | null;
  completedSteps: OnboardingStep[];
  progress: {
    hasProfile: boolean;
    reportCount: number;
    profileCompleted: boolean;
    firstReportUploaded: boolean;
    secondReportUploaded: boolean;
  };
}

export interface UserOnboardingStatus {
  onboardingCompleted: boolean;
  onboardingStep: string | null;
  profileCompleted: boolean;
  firstReportUploaded: boolean;
  secondReportUploaded: boolean;
  onboardingCompletedAt: Date | null;
  reportCount: number;
}

export interface OnboardingStepConfig {
  id: OnboardingStep;
  title: string;
  description: string;
  estimatedTime: string;
  isRequired: boolean;
  unlockRequirements?: {
    profileCompleted?: boolean;
    reportCount?: number;
  };
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Learn about your health intelligence platform',
    estimatedTime: '1 min',
    isRequired: true,
  },
  {
    id: 'profile',
    title: 'Setup Profile',
    description: 'Add your basic health information',
    estimatedTime: '2-3 min',
    isRequired: true,
  },
  {
    id: 'first-upload',
    title: 'Upload First Report',
    description: 'Upload your first lab report for analysis',
    estimatedTime: '3-5 min',
    isRequired: true,
    unlockRequirements: {
      profileCompleted: true,
    },
  },
  {
    id: 'data-review',
    title: 'Review Your Data',
    description: 'See what we extracted from your report',
    estimatedTime: '2 min',
    isRequired: true,
    unlockRequirements: {
      reportCount: 1,
    },
  },
  {
    id: 'complete',
    title: 'Dashboard Ready',
    description: 'Your personalized dashboard is ready',
    estimatedTime: '1 min',
    isRequired: true,
    unlockRequirements: {
      reportCount: 1,
    },
  },
];

export interface OnboardingMilestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  completedAt?: Date;
}