/**
 * Atomic Onboarding Guard Component
 * Handles onboarding completion checking and routing decisions
 * Prevents race conditions and inconsistent redirects
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface OnboardingGuardProps {
  children: React.ReactNode;
  requiresOnboarding?: boolean; // If true, redirects to dashboard when complete
  requiresCompletion?: boolean; // If true, redirects to onboarding when incomplete
}

interface OnboardingStatus {
  needsOnboarding: boolean;
  isComplete: boolean;
  loading: boolean;
  error?: string;
}

// Simple dashboard access check
async function checkDashboardAccess(): Promise<OnboardingStatus> {
  try {
    const response = await fetch('/api/onboarding');
    const data = await response.json();
    
    return {
      needsOnboarding: data.needsOnboarding ?? true,
      isComplete: data.canAccessDashboard ?? false,
      loading: false,
    };
  } catch (error) {
    return {
      needsOnboarding: true,
      isComplete: false,
      loading: false,
    };
  }
}

export function AtomicOnboardingGuard({ 
  children, 
  requiresOnboarding = false, 
  requiresCompletion = false 
}: OnboardingGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>({
    needsOnboarding: true,
    isComplete: false,
    loading: true,
  });

  // Check onboarding status when session is ready
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (!session?.user?.id) return;

    let isMounted = true;

    const checkStatus = async () => {
      const status = await checkDashboardAccess();
      if (!isMounted) return;
      setOnboardingStatus(status);
    };

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id, status, router]);

  // Handle routing based on onboarding status
  useEffect(() => {
    if (onboardingStatus.loading || status === 'loading') return;

    const { needsOnboarding, isComplete } = onboardingStatus;

    console.log('🚦 [GUARD] Routing decision:', {
      needsOnboarding,
      isComplete,
      requiresOnboarding,
      requiresCompletion,
      currentPath: window.location.pathname,
    });

    // If on onboarding page and onboarding is complete, redirect to dashboard
    if (requiresOnboarding && isComplete && !needsOnboarding) {
      console.log('✅ [GUARD] Onboarding complete, redirecting to dashboard');
      router.push('/dashboard');
      return;
    }

    // If requires completion and onboarding is not complete, redirect to onboarding
    if (requiresCompletion && needsOnboarding && !isComplete) {
      console.log('⏳ [GUARD] Onboarding required, redirecting to onboarding');
      router.push('/onboarding');
      return;
    }

  }, [onboardingStatus, requiresOnboarding, requiresCompletion, router, status]);

  // Show loading while checking
  if (status === 'loading' || onboardingStatus.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Checking your setup...</h2>
          <p className="text-gray-500">This will just take a moment</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (onboardingStatus.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Setup Check Failed</h2>
          <p className="text-gray-500 mb-4">We couldn't verify your onboarding status.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Convenience components for common use cases
export function OnboardingPageGuard({ children }: { children: React.ReactNode }) {
  return (
    <AtomicOnboardingGuard requiresOnboarding={true}>
      {children}
    </AtomicOnboardingGuard>
  );
}

export function DashboardPageGuard({ children }: { children: React.ReactNode }) {
  return (
    <AtomicOnboardingGuard requiresCompletion={true}>
      {children}
    </AtomicOnboardingGuard>
  );
}