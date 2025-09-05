/**
 * Contextual help tooltip component
 * Shows helpful information for new users
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useOnboarding } from '@/hooks/use-onboarding';

interface ContextualHelpTooltipProps {
  children: React.ReactNode;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showForNewUsers?: boolean;
  className?: string;
}

export function ContextualHelpTooltip({ 
  children, 
  title, 
  content, 
  position = 'top',
  showForNewUsers = true,
  className = ''
}: ContextualHelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { state } = useOnboarding();
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Only show for new users if specified
  const shouldShow = !showForNewUsers || (state?.needsOnboarding && !isDismissed);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible]);

  if (!shouldShow) {
    return <>{children}</>;
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-blue-600';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-blue-600';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-blue-600';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-blue-600';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-blue-600';
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={tooltipRef}>
      <div
        className="relative cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        {children}
        
        {/* Help indicator for new users */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse">
          <div className="absolute inset-0 w-3 h-3 bg-blue-500 rounded-full animate-ping opacity-75"></div>
        </div>
      </div>

      {/* Tooltip */}
      {isVisible && (
        <div className={`absolute z-50 ${getPositionClasses()}`}>
          <div className="bg-blue-600 text-white p-4 rounded-lg shadow-xl max-w-xs w-64">
            {/* Arrow */}
            <div className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`}></div>
            
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-sm">{title}</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDismissed(true);
                  setIsVisible(false);
                }}
                className="text-blue-200 hover:text-white ml-2 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-blue-100 leading-relaxed">
              {content}
            </p>
            
            <div className="mt-3 pt-3 border-t border-blue-500">
              <div className="flex items-center text-xs text-blue-200">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                First time here? We're here to help!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContextualHelpTooltip;