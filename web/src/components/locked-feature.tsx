/**
 * Locked feature component
 * Shows when features are not yet available with unlock requirements
 */

'use client';

import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/hooks/use-onboarding';
import { getFeatureNextSteps, getFeatureProgress, FEATURES } from '@/lib/feature-gating';

interface LockedFeatureProps {
  featureId: string;
  children?: React.ReactNode;
  className?: string;
  showProgress?: boolean;
}

export function LockedFeature({ 
  featureId, 
  children, 
  className = '',
  showProgress = true 
}: LockedFeatureProps) {
  const { state } = useOnboarding();
  const router = useRouter();

  const feature = FEATURES.find(f => f.id === featureId);
  const nextSteps = getFeatureNextSteps(featureId, state);
  const progress = getFeatureProgress(feature!, state);

  if (!feature) {
    return <div className="text-red-500">Feature not found: {featureId}</div>;
  }

  const getActionForStep = (step: string) => {
    if (step.includes('profile')) {
      return () => router.push('/profile');
    }
    if (step.includes('report')) {
      return () => router.push('/upload-enhanced');
    }
    if (step.includes('onboarding')) {
      return () => router.push('/onboarding');
    }
    return () => {};
  };

  const getIconForStep = (step: string) => {
    if (step.includes('profile')) return '👤';
    if (step.includes('report')) return '📄';
    if (step.includes('onboarding')) return '✅';
    return '🔒';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
        <div className="text-center p-6 max-w-sm">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {feature.name} Locked
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            {feature.unlockMessage}
          </p>

          {showProgress && progress > 0 && progress < 100 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {nextSteps.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700 mb-2">To unlock:</p>
              {nextSteps.map((step, index) => (
                <button
                  key={index}
                  onClick={getActionForStep(step)}
                  className="w-full flex items-center justify-between p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-700 transition-colors"
                >
                  <div className="flex items-center">
                    <span className="mr-2">{getIconForStep(step)}</span>
                    <span>{step}</span>
                  </div>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none">
        {children}
      </div>
    </div>
  );
}

export default LockedFeature;