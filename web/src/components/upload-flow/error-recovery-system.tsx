"use client";

import React, { useState, useCallback } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ErrorRecoveryProps {
  error: string | null;
  errorType?: 'network' | 'processing' | 'validation' | 'upload' | 'generic';
  onRetry?: () => void;
  onDismiss?: () => void;
  onFallback?: () => void;
  retryCount?: number;
  maxRetries?: number;
  showFallback?: boolean;
}

export function ErrorRecoverySystem({
  error,
  errorType = 'generic',
  onRetry,
  onDismiss,
  onFallback,
  retryCount = 0,
  maxRetries = 3,
  showFallback = false
}: ErrorRecoveryProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    if (!onRetry || retryCount >= maxRetries) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, retryCount, maxRetries]);

  if (!error) return null;

  const getErrorConfig = () => {
    switch (errorType) {
      case 'network':
        return {
          icon: WifiOff,
          title: 'Connection Issue',
          message: 'Please check your internet connection and try again.',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      case 'processing':
        return {
          icon: AlertTriangle,
          title: 'Processing Failed',
          message: 'We encountered an issue processing your files. Please try again.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'upload':
        return {
          icon: Upload,
          title: 'Upload Failed',
          message: 'File upload was interrupted. Please try uploading again.',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'validation':
        return {
          icon: AlertTriangle,
          title: 'Validation Error',
          message: 'Please check your input and try again.',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          icon: AlertTriangle,
          title: 'Something went wrong',
          message: 'An unexpected error occurred. Please try again.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;
  const canRetry = onRetry && retryCount < maxRetries;
  const hasReachedMaxRetries = retryCount >= maxRetries;

  return (
    <div className={`error-recovery-system rounded-lg border p-4 ${config.bgColor} ${config.borderColor}`} role="alert" aria-live="assertive">
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.color}`} />
        
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-sm ${config.color}`}>
            {config.title}
          </h4>
          
          <p className="text-sm text-gray-700 mt-1">
            {config.message}
          </p>
          
          <p className="text-xs text-gray-600 mt-1">
            {error}
          </p>

          {retryCount > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Attempt {retryCount + 1} of {maxRetries + 1}
            </p>
          )}

          <div className="flex items-center space-x-2 mt-3">
            {canRetry && (
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Try Again
                  </>
                )}
              </Button>
            )}

            {hasReachedMaxRetries && showFallback && onFallback && (
              <Button
                onClick={onFallback}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Use Alternative Method
              </Button>
            )}

            {onDismiss && (
              <Button
                onClick={onDismiss}
                size="sm"
                variant="ghost"
                className="text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function useErrorRecovery() {
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorRecoveryProps['errorType']>('generic');
  const [retryCount, setRetryCount] = useState(0);

  const showError = useCallback((errorMessage: string, type: ErrorRecoveryProps['errorType'] = 'generic') => {
    setError(errorMessage);
    setErrorType(type);
    setRetryCount(0);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  const incrementRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  return {
    error,
    errorType,
    retryCount,
    showError,
    clearError,
    incrementRetry
  };
}