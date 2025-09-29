/**
 * Fast-loading onboarding-aware dashboard
 * Optimized for quick initial load
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/hooks/use-onboarding';
import { OnboardingChecklist } from '@/components/onboarding-checklist';
import { MilestoneCelebration } from '@/components/milestone-celebration';

// Fast loading component
function FastDashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading your dashboard...</h2>
          <p className="text-gray-500">Setting up your personalized experience</p>
        </div>
        
        {/* Skeleton loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Welcome screen for new users
function FastWelcomeScreen({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Health Intelligence Platform
            </span>
          </h1>
          
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Transform your medical reports into actionable insights. Track trends, 
            get recommendations, and take control of your wellness journey.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
          <p className="text-gray-600 mb-6">
            Set up your profile and upload your first report in just a few minutes.
          </p>
          
          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

// Incomplete setup screen
function FastIncompleteSetupScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-xl mx-auto text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Almost There!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Complete your setup to unlock the full power of your health dashboard.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <button
            onClick={onContinue}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            Continue Setup
          </button>
        </div>
      </div>
    </div>
  );
}

interface FastOnboardingDashboardProps {
  children: React.ReactNode;
}

export function FastOnboardingDashboard({ children }: FastOnboardingDashboardProps) {
  const { data: session, status } = useSession();
  const { state, loading, error } = useOnboarding();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // Quick ready check with timeout fallback
  useEffect(() => {
    if (status !== 'loading' && !loading) {
      // Small delay to prevent flash
      const timer = setTimeout(() => setIsReady(true), 100);
      return () => clearTimeout(timer);
    }
    
    // Fallback timeout - force ready after 10 seconds to prevent infinite loading
    const fallbackTimer = setTimeout(() => {
      console.warn('Onboarding dashboard timeout - forcing ready state');
      setIsReady(true);
    }, 10000);
    
    return () => clearTimeout(fallbackTimer);
  }, [status, loading]);

  // Handle authentication redirect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Handle authentication loading
  if (status === 'loading' || loading || !isReady) {
    return <FastDashboardLoading />;
  }

  // Handle authentication error
  if (status === 'unauthenticated') {
    return <FastDashboardLoading />;
  }

  // Handle onboarding error - show dashboard anyway
  if (error) {
    console.error('Onboarding error:', error);
    return (
      <>
        <MilestoneCelebration />
        <div className="max-w-7xl mx-auto px-4 py-4">
          <OnboardingChecklist className="mb-6" />
        </div>
        {children}
      </>
    );
  }

  // Handle onboarding state
  if (state) {
    // User needs onboarding - show welcome screen
    if (state.needsOnboarding) {
      return (
        <FastWelcomeScreen 
          onGetStarted={() => router.push('/onboarding')} 
        />
      );
    }
  }

  // User is set up - show the dashboard with onboarding elements
  return (
    <>
      <MilestoneCelebration />
      <div className="max-w-7xl mx-auto px-4 py-4">
        <OnboardingChecklist className="mb-6" />
      </div>
      {children}
    </>
  );
}

export default FastOnboardingDashboard;