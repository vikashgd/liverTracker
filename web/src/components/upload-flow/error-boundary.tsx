"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export interface ErrorBoundaryProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryText?: string;
}

export function ErrorBoundary({ 
  error, 
  onRetry, 
  onDismiss, 
  retryText = "Try Again" 
}: ErrorBoundaryProps) {
  if (!error) return null;

  return (
    <div className="error-boundary bg-red-50 border border-red-200 rounded-lg p-4 mb-4" role="alert">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-red-600 text-xl">⚠️</span>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-1">
            Something went wrong
          </h3>
          <p className="text-sm text-red-700 mb-3">
            {error}
          </p>
          <div className="flex space-x-2">
            {onRetry && (
              <Button
                onClick={onRetry}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {retryText}
              </Button>
            )}
            {onDismiss && (
              <Button
                onClick={onDismiss}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}