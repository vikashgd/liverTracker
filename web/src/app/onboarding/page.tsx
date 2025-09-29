/**
 * Onboarding flow page
 * Guides new users through setup process
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOnboarding } from '@/hooks/use-onboarding';
import { OnboardingStep } from '@/types/onboarding';
import { OnboardingPageGuard } from '@/components/atomic-onboarding-guard';

// Loading component
function OnboardingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Setting up your onboarding...</h2>
        <p className="text-gray-500">This will just take a moment</p>
      </div>
    </div>
  );
}

// Step 1: Profile Setup
function ProfileSetupStep({ onNext }: { onNext: () => void }) {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Up Your Profile</h1>
        <p className="text-lg text-gray-600">
          Tell us a bit about yourself to get personalized health insights
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            We'll help you complete your profile
          </h2>
          <p className="text-gray-600 mb-6">
            Your profile helps us provide accurate health insights and recommendations. 
            Don't worry - you can always update this information later.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center p-4 bg-blue-50 rounded-lg">
            <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-blue-900">Essential Information</p>
              <p className="text-sm text-blue-700">Age, gender, height, and weight for accurate calculations</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-green-50 rounded-lg">
            <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-green-900">Health Conditions</p>
              <p className="text-sm text-green-700">Any liver conditions or medications (optional)</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-purple-50 rounded-lg">
            <svg className="w-5 h-5 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="font-medium text-purple-900">Preferences</p>
              <p className="text-sm text-purple-700">Units (US/Metric) and timezone settings</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => router.push('/profile?onboarding=true')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            Set Up Profile
          </button>
        </div>
      </div>
    </div>
  );
}

// Step 2: First Upload
function FirstUploadStep({ onNext, onBack }: { onNext: () => void; onBack?: () => void }) {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Your First Report</h1>
        <p className="text-lg text-gray-600">
          Let's analyze your first lab report to start tracking your health
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            What reports can you upload?
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">✅ Supported Formats</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• PDF lab reports</li>
              <li>• JPG/PNG images</li>
              <li>• Blood work panels</li>
              <li>• Liver function tests</li>
              <li>• Complete metabolic panels</li>
            </ul>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">📊 What we extract</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• ALT, AST, Bilirubin</li>
              <li>• Platelets, INR</li>
              <li>• Creatinine, Albumin</li>
              <li>• Sodium, Potassium</li>
              <li>• And many more...</li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-blue-900 mb-1">Pro Tip</p>
              <p className="text-sm text-blue-700">
                For best results, upload clear, high-quality images or PDFs. 
                Our AI can extract data from most standard lab report formats.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => onBack?.()}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            Back to Profile
          </button>
          <button
            onClick={() => router.push('/upload-enhanced?onboarding=true')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200"
          >
            Upload First Report
          </button>
        </div>
      </div>
    </div>
  );
}

// Onboarding completion
function OnboardingComplete() {
  const router = useRouter();

  const handleComplete = () => {
    router.push('/dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">🎉 You're All Set!</h1>
        <p className="text-xl text-gray-600 mb-8">
          Your health intelligence dashboard is ready to help you track and improve your wellness.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">What's next?</h2>
        
        <div className="grid gap-4 mb-8">
          <div className="flex items-center p-4 bg-blue-50 rounded-lg text-left">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">1</div>
            <div>
              <p className="font-semibold text-gray-900">Explore Your Dashboard</p>
              <p className="text-sm text-gray-600">See your health metrics, trends, and insights</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-green-50 rounded-lg text-left">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">2</div>
            <div>
              <p className="font-semibold text-gray-900">Upload More Reports</p>
              <p className="text-sm text-gray-600">Add more reports to unlock trend analysis</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-purple-50 rounded-lg text-left">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">3</div>
            <div>
              <p className="font-semibold text-gray-900">Get AI Insights</p>
              <p className="text-sm text-gray-600">Receive personalized health recommendations</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleComplete}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

function OnboardingPageContent() {
  const { data: session, status } = useSession();
  const { canAccessDashboard, needsOnboarding, loading, error } = useOnboarding();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('profile');

  // Handle loading states
  if (status === 'loading' || loading) {
    return <OnboardingLoading />;
  }

  // Handle errors
  if (error) {
    console.error('Onboarding error:', error);
    return <OnboardingLoading />;
  }

  // If user can access dashboard, redirect them
  if (canAccessDashboard && !needsOnboarding) {
    router.push('/dashboard');
    return <OnboardingLoading />;
  }

  // Render appropriate step
  const renderStep = () => {
    switch (currentStep) {
      case 'profile':
        return <ProfileSetupStep onNext={() => setCurrentStep('first-upload')} />;
      case 'first-upload':
        return <FirstUploadStep onNext={() => setCurrentStep('complete')} onBack={() => setCurrentStep('profile')} />;
      case 'complete':
        return <OnboardingComplete />;
      default:
        return <ProfileSetupStep onNext={() => setCurrentStep('first-upload')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      {/* Progress indicator */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center ${currentStep === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep === 'profile' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Profile</span>
          </div>

          <div className="w-12 h-0.5 bg-gray-300"></div>

          <div className={`flex items-center ${currentStep === 'first-upload' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep === 'first-upload' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Upload</span>
          </div>

          <div className="w-12 h-0.5 bg-gray-300"></div>

          <div className={`flex items-center ${currentStep === 'complete' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep === 'complete' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Complete</span>
          </div>
        </div>
      </div>

      {/* Step content */}
      {renderStep()}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <OnboardingPageGuard>
      <OnboardingPageContent />
    </OnboardingPageGuard>
  );
}