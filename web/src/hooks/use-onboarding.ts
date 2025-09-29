/**
 * ULTRA SIMPLE ONBOARDING HOOK - JUST TWO FLAGS
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface SimpleOnboardingState {
  canAccessDashboard: boolean;
  needsOnboarding: boolean;
}

export function useOnboarding() {
  const [canAccessDashboard, setCanAccessDashboard] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkOnboardingStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/onboarding');
      if (!response.ok) {
        throw new Error('Failed to check onboarding status');
      }
      
      const data: SimpleOnboardingState = await response.json();
      
      setCanAccessDashboard(data.canAccessDashboard);
      setNeedsOnboarding(data.needsOnboarding);
    } catch (err) {
      console.error('Error checking onboarding:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Safe defaults
      setCanAccessDashboard(false);
      setNeedsOnboarding(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  return {
    canAccessDashboard,
    needsOnboarding,
    loading,
    error,
    refresh: checkOnboardingStatus,
    // Legacy compatibility
    state: { needsOnboarding },
    isComplete: canAccessDashboard,
    progress: canAccessDashboard ? 100 : 0,
  };
}