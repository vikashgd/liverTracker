/**
 * Feature gating logic for progressive feature unlocking
 * Controls which features are available based on user progress
 */

import { OnboardingState } from '@/types/onboarding';

export interface FeatureRequirement {
  hasProfile?: boolean;
  minReports?: number;
  onboardingComplete?: boolean;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  requirements: FeatureRequirement;
  unlockMessage: string;
}

export const FEATURES: Feature[] = [
  {
    id: 'basic-metrics',
    name: 'Basic Health Metrics',
    description: 'View individual lab values and basic information',
    requirements: {
      minReports: 1
    },
    unlockMessage: 'Upload your first report to see basic health metrics'
  },
  {
    id: 'trend-analysis',
    name: 'Trend Analysis',
    description: 'Track how your health metrics change over time',
    requirements: {
      minReports: 2
    },
    unlockMessage: 'Upload 2+ reports to unlock trend analysis'
  },
  {
    id: 'ai-insights',
    name: 'AI Health Insights',
    description: 'Get personalized recommendations and pattern analysis',
    requirements: {
      minReports: 3,
      hasProfile: true
    },
    unlockMessage: 'Complete your profile and upload 3+ reports for AI insights'
  },
  {
    id: 'risk-scoring',
    name: 'Medical Risk Scoring',
    description: 'Calculate MELD, Child-Pugh, and other clinical scores',
    requirements: {
      hasProfile: true,
      minReports: 2
    },
    unlockMessage: 'Complete your profile and upload 2+ reports for risk scoring'
  },
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Comprehensive health analysis and predictions',
    requirements: {
      hasProfile: true,
      minReports: 5,
      onboardingComplete: true
    },
    unlockMessage: 'Complete onboarding and upload 5+ reports for advanced analytics'
  },
  {
    id: 'export-reports',
    name: 'Export & Sharing',
    description: 'Export reports and share with healthcare providers',
    requirements: {
      hasProfile: true,
      minReports: 1
    },
    unlockMessage: 'Complete your profile and upload a report to enable exports'
  }
];

/**
 * Check if a feature is available for the current user
 */
export function isFeatureAvailable(featureId: string, state: OnboardingState | null): boolean {
  if (!state) return false;

  const feature = FEATURES.find(f => f.id === featureId);
  if (!feature) return false;

  const { requirements } = feature;
  const { progress } = state;

  // Check profile requirement
  if (requirements.hasProfile && !progress.hasProfile) {
    return false;
  }

  // Check minimum reports requirement
  if (requirements.minReports && progress.reportCount < requirements.minReports) {
    return false;
  }

  // Check onboarding completion requirement
  if (requirements.onboardingComplete && state.needsOnboarding) {
    return false;
  }

  return true;
}

/**
 * Get the unlock message for a feature
 */
export function getFeatureUnlockMessage(featureId: string): string {
  const feature = FEATURES.find(f => f.id === featureId);
  return feature?.unlockMessage || 'Feature requirements not met';
}

/**
 * Get all features with their availability status
 */
export function getFeatureStatus(state: OnboardingState | null) {
  return FEATURES.map(feature => ({
    ...feature,
    available: isFeatureAvailable(feature.id, state),
    progress: getFeatureProgress(feature, state)
  }));
}

/**
 * Calculate progress towards unlocking a feature (0-100%)
 */
export function getFeatureProgress(feature: Feature, state: OnboardingState | null): number {
  if (!state) return 0;

  const { requirements } = feature;
  const { progress } = state;
  let totalRequirements = 0;
  let metRequirements = 0;

  // Profile requirement
  if (requirements.hasProfile !== undefined) {
    totalRequirements++;
    if (progress.hasProfile) metRequirements++;
  }

  // Reports requirement
  if (requirements.minReports !== undefined) {
    totalRequirements++;
    if (progress.reportCount >= requirements.minReports) {
      metRequirements++;
    } else {
      // Partial credit for progress towards report requirement
      const reportProgress = Math.min(progress.reportCount / requirements.minReports, 1);
      metRequirements += reportProgress;
    }
  }

  // Onboarding completion requirement
  if (requirements.onboardingComplete !== undefined) {
    totalRequirements++;
    if (!state.needsOnboarding) metRequirements++;
  }

  return totalRequirements > 0 ? Math.round((metRequirements / totalRequirements) * 100) : 100;
}

/**
 * Get the next steps to unlock a feature
 */
export function getFeatureNextSteps(featureId: string, state: OnboardingState | null): string[] {
  if (!state) return [];

  const feature = FEATURES.find(f => f.id === featureId);
  if (!feature || isFeatureAvailable(featureId, state)) return [];

  const { requirements } = feature;
  const { progress } = state;
  const steps: string[] = [];

  if (requirements.hasProfile && !progress.hasProfile) {
    steps.push('Complete your profile');
  }

  if (requirements.minReports && progress.reportCount < requirements.minReports) {
    const needed = requirements.minReports - progress.reportCount;
    steps.push(`Upload ${needed} more report${needed > 1 ? 's' : ''}`);
  }

  if (requirements.onboardingComplete && state.needsOnboarding) {
    steps.push('Complete the onboarding process');
  }

  return steps;
}

export default {
  isFeatureAvailable,
  getFeatureUnlockMessage,
  getFeatureStatus,
  getFeatureNextSteps,
  getFeatureProgress,
  FEATURES
};