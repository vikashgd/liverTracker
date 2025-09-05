/**
 * Persistent onboarding checklist component
 * Shows progress and quick actions for incomplete items
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/hooks/use-onboarding';

interface OnboardingChecklistProps {
  className?: string;
  showDismiss?: boolean;
}

export function OnboardingChecklist({ className = '', showDismiss = true }: OnboardingChecklistProps) {
  const { state, loading, completeOnboarding } = useOnboarding();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if loading, no state, or user doesn't need onboarding
  if (loading || !state || !state.needsOnboarding || isDismissed) {
    return null;
  }

  const checklistItems = [
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add basic health information for personalized insights',
      completed: state.progress.hasProfile,
      action: () => router.push('/profile'),
      icon: '👤',
      color: 'blue'
    },
    {
      id: 'first-report',
      title: 'Upload First Report',
      description: 'Upload your first lab report to start tracking',
      completed: state.progress.reportCount >= 1,
      action: () => router.push('/upload-enhanced'),
      icon: '📄',
      color: 'green'
    },
    {
      id: 'second-report',
      title: 'Upload Second Report',
      description: 'Add another report to unlock trend analysis',
      completed: state.progress.reportCount >= 2,
      action: () => router.push('/upload-enhanced'),
      icon: '📊',
      color: 'purple'
    }
  ];

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  const handleDismiss = async () => {
    if (completedCount === totalCount) {
      await completeOnboarding();
    }
    setIsDismissed(true);
  };

  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' | 'hover') => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-100'
      },
      green: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-200',
        hover: 'hover:bg-green-100'
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-100'
      }
    };
    return colors[color as keyof typeof colors]?.[variant] || '';
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div 
        className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">✅</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Setup Progress</h3>
              <p className="text-sm text-gray-600">
                {completedCount} of {totalCount} steps completed
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                {Math.round(progressPercentage)}%
              </div>
              <div className="w-16 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg 
                className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-4">
          <div className="space-y-3">
            {checklistItems.map((item) => (
              <div 
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                  item.completed 
                    ? 'bg-green-50 border-green-200' 
                    : `${getColorClasses(item.color, 'bg')} ${getColorClasses(item.color, 'border')} ${getColorClasses(item.color, 'hover')}`
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.completed ? 'bg-green-100' : 'bg-white'
                  }`}>
                    {item.completed ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm">{item.icon}</span>
                    )}
                  </div>
                  
                  <div>
                    <h4 className={`font-medium ${item.completed ? 'text-green-800' : 'text-gray-900'}`}>
                      {item.title}
                    </h4>
                    <p className={`text-sm ${item.completed ? 'text-green-600' : 'text-gray-600'}`}>
                      {item.description}
                    </p>
                  </div>
                </div>

                {!item.completed && (
                  <button
                    onClick={item.action}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${getColorClasses(item.color, 'text')} ${getColorClasses(item.color, 'hover')}`}
                  >
                    Start
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {completedCount === totalCount ? (
                <span className="text-green-600 font-medium">🎉 Setup complete!</span>
              ) : (
                `${totalCount - completedCount} steps remaining`
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {showDismiss && (
                <button
                  onClick={handleDismiss}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {completedCount === totalCount ? 'Finish Setup' : 'Dismiss'}
                </button>
              )}
              
              {completedCount < totalCount && (
                <button
                  onClick={() => router.push('/onboarding')}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue Setup
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OnboardingChecklist;