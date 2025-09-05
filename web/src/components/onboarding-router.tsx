/**
 * Onboarding Router Component
 * Handles routing logic based on user's onboarding status
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOnboarding } from '@/hooks/use-onboarding';
import { SimpleDashboard } from '@/components/simple-dashboard';
import Link from 'next/link';

// Loading component
function OnboardingRouterLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading your dashboard...</h2>
        <p className="text-gray-500">Checking your onboarding status</p>
      </div>
    </div>
  );
}

// Unauthenticated state
function UnauthenticatedView() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to LiverTracker</h1>
          <p className="text-gray-600 mb-6">
            Your intelligent medical platform for liver health monitoring and analysis.
          </p>
        </div>
        
        <div className="space-y-3">
          <Link 
            href="/auth/signin"
            className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Sign In to Continue
          </Link>
          <Link 
            href="/auth/signup"
            className="block w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Create New Account
          </Link>
        </div>
      </div>
    </div>
  );
}

// Onboarding required view
function OnboardingRequiredView() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to onboarding after a brief delay to show the message
    const timer = setTimeout(() => {
      router.push('/onboarding');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome! Let's get you set up</h1>
          <p className="text-gray-600 mb-6">
            We need to set up your profile and help you upload your first report to get started.
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-4 mb-6 border border-blue-200">
          <div className="flex items-center justify-center mb-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-600 font-medium">Redirecting to onboarding...</span>
          </div>
        </div>
        
        <button
          onClick={() => router.push('/onboarding')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Start Setup Now
        </button>
      </div>
    </div>
  );
}

export function OnboardingRouter() {
  const { data: session, status } = useSession();
  const { state, loading, error } = useOnboarding();
  const [isInitialized, setIsInitialized] = useState(false);

  // Mark as initialized once we have session status
  useEffect(() => {
    if (status !== 'loading') {
      setIsInitialized(true);
    }
  }, [status]);

  // Show loading while checking authentication and onboarding
  if (!isInitialized || status === 'loading' || (status === 'authenticated' && loading)) {
    return <OnboardingRouterLoading />;
  }

  // Not authenticated - show sign in
  if (status === 'unauthenticated') {
    return <UnauthenticatedView />;
  }

  // Handle onboarding errors by falling back to dashboard
  if (error) {
    console.error('Onboarding error, falling back to dashboard:', error);
    return <SimpleDashboard />;
  }

  // Authenticated but no onboarding state yet - show loading
  if (!state) {
    return <OnboardingRouterLoading />;
  }

  // User needs onboarding - redirect to onboarding flow
  if (state.needsOnboarding) {
    return <OnboardingRequiredView />;
  }

  // User has completed onboarding - show dashboard
  return <SimpleDashboard />;
}