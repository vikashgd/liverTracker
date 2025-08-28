"use client";

import React from "react";

export interface ProcessingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  onCancel?: () => void;
}

export function ProcessingOverlay({
  isVisible,
  message = "Processing with AI Vision - Our AI is detecting professional medical data",
  progress = 0,
  onCancel
}: ProcessingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="processing-overlay fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        {/* AI Icon with Pulse Animation */}
        <div className="w-20 h-20 bg-medical-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <div className="w-12 h-12 bg-medical-primary-600 rounded-lg flex items-center justify-center animate-bounce">
            <span className="text-white font-bold text-xl">🤖</span>
          </div>
        </div>

        {/* Enhanced Spinner with Multiple Rings */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-medical-primary-200 border-t-medical-primary-600 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-2 border-medical-primary-300 border-b-medical-primary-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '0.8s'}}></div>
          <div className="absolute inset-4 w-4 h-4 bg-medical-primary-600 rounded-full animate-ping"></div>
        </div>

        {/* Message */}
        <h2 className="text-xl font-semibold text-medical-neutral-900 mb-2">
          Processing Your Medical Report
        </h2>
        <p className="text-medical-neutral-600 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="w-full bg-medical-neutral-200 rounded-full h-2 mb-4">
            <div 
              className="bg-medical-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}

        {/* Cancel Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-medical-neutral-500 hover:text-medical-neutral-700 text-sm underline"
          >
            Cancel Processing
          </button>
        )}
      </div>
    </div>
  );
}