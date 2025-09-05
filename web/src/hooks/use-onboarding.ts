/**
 * React hook for managing user onboarding state
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { OnboardingState, OnboardingStep } from '@/types/onboarding';
import { calculateOnboardingProgress, getNextOnboardingStep } from '@/lib/onboarding-utils';
// Client-side onboarding functions using API calls
async function fetchOnboardingState(): Promise<OnboardingState | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch('/api/onboarding', {
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Onboarding API timed out, using fallback');
    } else {
      console.error('Failed to fetch onboarding state:', error);
    }
    return null;
  }
}

async function updateOnboardingAPI(action: string, data?: any): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Onboarding update timed out');
    } else {
      console.error('Failed to update onboarding:', error);
    }
    return false;
  }
}

interface UseOnboardingReturn {
  state: OnboardingState | null;
  loading: boolean;
  error: string | null;
  progress: number;
  nextStep: OnboardingStep | null;
  
  // Actions
  goToStep: (step: OnboardingStep) => Promise<boolean>;
  completeProfile: () => Promise<boolean>;
  completeFirstUpload: () => Promise<boolean>;
  completeSecondUpload: () => Promise<boolean>;
  completeOnboarding: () => Promise<boolean>;
  refreshState: () => Promise<void>;
}

export function useOnboarding(): UseOnboardingReturn {
  const { data: session } = useSession();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load onboarding state
  const loadOnboardingState = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const onboardingState = await fetchOnboardingState();
      
      // If API fails, use a fallback state to prevent hanging
      if (!onboardingState) {
        console.warn('Using fallback onboarding state');
        setState({
          isNewUser: false,
          needsOnboarding: false,
          currentStep: null,
          completedSteps: ['welcome', 'profile', 'first-upload', 'data-review'],
          progress: {
            hasProfile: true,
            reportCount: 0,
            profileCompleted: true,
            firstReportUploaded: false,
            secondReportUploaded: false,
          },
        });
      } else {
        setState(onboardingState);
      }
    } catch (err) {
      console.error('Error loading onboarding state:', err);
      setError('Failed to load onboarding state');
      // Set fallback state even on error
      setState({
        isNewUser: false,
        needsOnboarding: false,
        currentStep: null,
        completedSteps: ['welcome', 'profile', 'first-upload', 'data-review'],
        progress: {
          hasProfile: true,
          reportCount: 0,
          profileCompleted: true,
          firstReportUploaded: false,
          secondReportUploaded: false,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Load state on mount and when session changes
  useEffect(() => {
    loadOnboardingState();
  }, [loadOnboardingState]);

  // Calculate derived values
  const progress = state ? calculateOnboardingProgress(state) : 0;
  const nextStep = state ? getNextOnboardingStep(state) : null;

  // Action: Go to specific step
  const goToStep = useCallback(async (step: OnboardingStep): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      const success = await updateOnboardingAPI('update-step', { step });
      if (success) {
        await loadOnboardingState();
      }
      return success;
    } catch (err) {
      console.error('Error updating onboarding step:', err);
      setError('Failed to update onboarding step');
      return false;
    }
  }, [session?.user?.id, loadOnboardingState]);

  // Action: Complete profile setup
  const completeProfile = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      const success = await updateOnboardingAPI('mark-profile-completed');
      if (success) {
        await loadOnboardingState();
      }
      return success;
    } catch (err) {
      console.error('Error completing profile:', err);
      setError('Failed to complete profile');
      return false;
    }
  }, [session?.user?.id, loadOnboardingState]);

  // Action: Complete first upload
  const completeFirstUpload = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      const success = await updateOnboardingAPI('mark-first-report');
      if (success) {
        await loadOnboardingState();
      }
      return success;
    } catch (err) {
      console.error('Error completing first upload:', err);
      setError('Failed to complete first upload');
      return false;
    }
  }, [session?.user?.id, loadOnboardingState]);

  // Action: Complete second upload
  const completeSecondUpload = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      const success = await updateOnboardingAPI('mark-second-report');
      if (success) {
        await loadOnboardingState();
      }
      return success;
    } catch (err) {
      console.error('Error completing second upload:', err);
      setError('Failed to complete second upload');
      return false;
    }
  }, [session?.user?.id, loadOnboardingState]);

  // Action: Complete entire onboarding
  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      const success = await updateOnboardingAPI('complete-onboarding');
      if (success) {
        await loadOnboardingState();
      }
      return success;
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setError('Failed to complete onboarding');
      return false;
    }
  }, [session?.user?.id, loadOnboardingState]);

  // Action: Refresh state
  const refreshState = useCallback(async (): Promise<void> => {
    await loadOnboardingState();
  }, [loadOnboardingState]);

  return {
    state,
    loading,
    error,
    progress,
    nextStep,
    goToStep,
    completeProfile,
    completeFirstUpload,
    completeSecondUpload,
    completeOnboarding,
    refreshState,
  };
}