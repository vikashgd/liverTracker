"use client";

import { useState } from "react";
import { AuthError } from "@/lib/auth-error-manager";

interface EnhancedErrorDisplayProps {
  error: AuthError;
  onRetry?: () => void;
  onFallbackAction?: (action: string) => void;
  onDismiss?: () => void;
  className?: string;
}

export default function EnhancedErrorDisplay({
  error,
  onRetry,
  onFallbackAction,
  onDismiss,
  className = ""
}: EnhancedErrorDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityStyles = () => {
    switch (error.severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'high':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = () => {
    switch (error.severity) {
      case 'critical':
      case 'high':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getErrorTitle = () => {
    switch (error.category) {
      case 'validation':
        return 'Validation Error';
      case 'network':
        return 'Connection Error';
      case 'server':
        return 'Server Error';
      case 'oauth':
        return 'Sign-In Error';
      case 'security':
        return 'Authentication Error';
      case 'session':
        return 'Session Error';
      default:
        return 'Error';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getSeverityStyles()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getSeverityIcon()}
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {getErrorTitle()}
            </h3>
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="mt-2 text-sm">
            <p>{error.userMessage}</p>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            {error.retryable && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            )}

            {error.fallbackOptions?.map((option, index) => (
              <button
                key={index}
                onClick={() => onFallbackAction?.(option)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {option}
              </button>
            ))}
          </div>

          {/* Debug Information (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {isExpanded ? 'Hide' : 'Show'} Debug Info
              </button>
              
              {isExpanded && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                  <div><strong>Code:</strong> {error.code}</div>
                  <div><strong>Category:</strong> {error.category}</div>
                  <div><strong>Severity:</strong> {error.severity}</div>
                  <div><strong>Retryable:</strong> {error.retryable ? 'Yes' : 'No'}</div>
                  {error.metadata && (
                    <div className="mt-1">
                      <strong>Metadata:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto">
                        {JSON.stringify(error.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryDisplayProps {
  error: Error;
  resetError: () => void;
  className?: string;
}

export function ErrorBoundaryDisplay({
  error,
  resetError,
  className = ""
}: ErrorBoundaryDisplayProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center mb-4">
          <svg className="w-8 h-8 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h1 className="text-xl font-semibold text-gray-900">
            Something went wrong
          </h1>
        </div>
        
        <p className="text-gray-600 mb-6">
          We encountered an unexpected error. This has been logged and we'll look into it.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={resetError}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Go Home
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              Error Details (Development)
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

interface NetworkErrorDisplayProps {
  onRetry: () => void;
  className?: string;
}

export function NetworkErrorDisplay({
  onRetry,
  className = ""
}: NetworkErrorDisplayProps) {
  return (
    <div className={`text-center p-6 ${className}`}>
      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Connection Error
      </h3>
      
      <p className="text-gray-600 mb-4">
        Unable to connect to our servers. Please check your internet connection and try again.
      </p>
      
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Try Again
      </button>
    </div>
  );
}