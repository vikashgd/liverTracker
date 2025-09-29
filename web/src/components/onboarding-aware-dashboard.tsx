/**
 * Onboarding-aware dashboard wrapper
 * Detects user onboarding status and routes appropriately
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/hooks/use-onboarding';
import { OnboardingState } from '@/types/onboarding';

// Loading component
function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading your dashboard...</h2>
        <p className="text-gray-500">Checking your setup status</p>
      </div>
    </div>
  );
}

// Welcome screen for new users
function WelcomeScreen({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Welcome to Your Personal
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Health Intelligence Platform
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your medical reports into actionable insights. Track your health trends, 
            get personalized recommendations, and take control of your wellness journey.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Upload Reports</h3>
            <p className="text-sm text-gray-600">Upload lab reports and get instant analysis</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Track Trends</h3>
            <p className="text-sm text-gray-600">See how your health metrics change over time</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Get Insights</h3>
            <p className="text-sm text-gray-600">Receive personalized health recommendations</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Medical Scores</h3>
            <p className="text-sm text-gray-600">Calculate MELD, Child-Pugh and other scores</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
          <p className="text-gray-600 mb-6">
            It only takes a few minutes to set up your profile and upload your first report.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started
            </button>
            
            <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200">
              View Demo
            </button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">Trusted by healthcare professionals</p>
          <div className="flex items-center justify-center space-x-8 opacity-60">
            <div className="text-xs text-gray-400">🔒 HIPAA Compliant</div>
            <div className="text-xs text-gray-400">🛡️ Secure Encryption</div>
            <div className="text-xs text-gray-400">📊 Clinical Grade</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty state for users with some progress but incomplete setup
function IncompleteSetupScreen() {
  const router = useRouter();
  const { needsOnboarding } = useOnboarding();
  
  // Create a simple state object for compatibility
  const state = { needsOnboarding };

  const getNextAction = () => {
    if (state.needsOnboarding) {
      return {
        title: 'Complete Your Setup',
        description: 'Finish your profile and upload a report to get started',
        action: 'Continue Setup',
        href: '/onboarding'
      };
    }

    return null;
  };

  const nextAction = getNextAction();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Almost There!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Complete your setup to unlock the full power of your health dashboard.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">Setup Status</span>
            <span className="text-sm text-gray-500">
              Incomplete
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: '50%' }}
            ></div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className={`flex items-center ${!state.needsOnboarding ? 'text-green-600' : 'text-gray-400'}`}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Profile
            </div>
            <div className={`flex items-center ${!state.needsOnboarding ? 'text-green-600' : 'text-gray-400'}`}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              First Report
            </div>
            <div className={`flex items-center ${!state.needsOnboarding ? 'text-green-600' : 'text-gray-400'}`}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Trends
            </div>
          </div>
        </div>

        {/* Next Action */}
        {nextAction && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {nextAction.title}
            </h2>
            <p className="text-gray-600 mb-6">
              {nextAction.description}
            </p>
            
            <button
              onClick={() => router.push(nextAction.href)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              {nextAction.action}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface OnboardingAwareDashboardProps {
  children: React.ReactNode;
}

export function OnboardingAwareDashboard({ children }: OnboardingAwareDashboardProps) {
  const { data: session, status } = useSession();
  const { state, loading, error } = useOnboarding();
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);

  // Handle authentication loading
  if (status === 'loading' || loading) {
    return <DashboardLoading />;
  }

  // Handle authentication error
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return <DashboardLoading />;
  }

  // Handle onboarding error
  if (error) {
    console.error('Onboarding error:', error);
    // Fall back to showing the dashboard
    return <>{children}</>;
  }

  // Handle onboarding state
  if (state) {
    // User needs onboarding - show welcome screen
    if (state.needsOnboarding && !showWelcome) {
      return (
        <WelcomeScreen 
          onGetStarted={() => router.push('/onboarding')} 
        />
      );
    }

    // User needs onboarding
    if (state.needsOnboarding) {
      return <IncompleteSetupScreen />;
    }
  }

  // User is fully set up - show the dashboard
  return <>{children}</>;
}

export default OnboardingAwareDashboard;