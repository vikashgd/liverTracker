"use client";

import React, { useState, useEffect } from "react";
import { Brain, FileText, Zap, CheckCircle, Clock, Shield } from "lucide-react";

export interface ProcessingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  onCancel?: () => void;
}

const processingSteps = [
  { id: 1, label: "Uploading Report", icon: FileText, duration: 2 },
  { id: 2, label: "AI Analysis", icon: Brain, duration: 15 },
  { id: 3, label: "Data Extraction", icon: Zap, duration: 8 },
  { id: 4, label: "Validation", icon: CheckCircle, duration: 3 }
];

const processingMessages = [
  "🔍 Scanning document structure...",
  "🧠 AI analyzing medical data...", 
  "📊 Extracting lab values...",
  "🩺 Identifying medical parameters...",
  "✨ Organizing results...",
  "🔬 Validating extracted data...",
  "📋 Preparing your report..."
];

export function ProcessingOverlay({
  isVisible,
  message = "Processing with AI Vision - Our AI is detecting professional medical data",
  progress = 0,
  onCancel
}: ProcessingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(45);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setCurrentMessage(0);
      setElapsedTime(0);
      setEstimatedTime(45);
      return;
    }

    // Timer for elapsed time
    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Step progression based on time
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        const nextStep = Math.min(prev + 1, processingSteps.length - 1);
        return nextStep;
      });
    }, 8000); // Change step every 8 seconds

    // Message rotation
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % processingMessages.length);
    }, 3000); // Change message every 3 seconds

    // Update estimated time based on progress
    const estimateInterval = setInterval(() => {
      setEstimatedTime(prev => {
        if (elapsedTime < 10) return Math.max(30, prev - 2);
        if (elapsedTime < 20) return Math.max(20, prev - 1);
        return Math.max(5, prev - 1);
      });
    }, 2000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(stepInterval);
      clearInterval(messageInterval);
      clearInterval(estimateInterval);
    };
  }, [isVisible, elapsedTime]);

  if (!isVisible) return null;

  return (
    <div className="processing-overlay fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="text-center max-w-lg mx-auto p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-100">
        
        {/* LiverTracker Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <img 
            src="/logo150x150.png" 
            alt="LiverTracker Logo" 
            className="w-12 h-12"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900">LiverTracker</h1>
            <p className="text-xs text-gray-500">AI Processing Engine</p>
          </div>
        </div>

        {/* Enhanced Visual Indicator */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          {/* Middle ring */}
          <div className="absolute inset-3 border-3 border-indigo-200 border-r-indigo-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          {/* Inner pulsing core */}
          <div className="absolute inset-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full animate-pulse flex items-center justify-center">
            <Brain className="w-6 h-6 text-white animate-bounce" />
          </div>
          {/* Floating particles */}
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
          <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-indigo-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
        </div>

        {/* Main Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🧠 AI Processing Your Report
        </h2>
        
        {/* Dynamic Message */}
        <p className="text-lg text-blue-600 font-medium mb-6 min-h-[28px] transition-all duration-500">
          {processingMessages[currentMessage]}
        </p>

        {/* Processing Steps */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {processingSteps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-green-500 text-white shadow-lg' 
                    : isActive 
                      ? 'bg-blue-500 text-white shadow-lg animate-pulse' 
                      : 'bg-gray-200 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <StepIcon className={`w-6 h-6 ${isActive ? 'animate-bounce' : ''}`} />
                  )}
                </div>
                <span className={`text-xs font-medium transition-colors duration-300 ${
                  isCompleted 
                    ? 'text-green-600' 
                    : isActive 
                      ? 'text-blue-600' 
                      : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out relative"
            style={{ width: `${Math.min(Math.max(progress, (currentStep + 1) * 25), 100)}%` }}
          >
            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
          </div>
        </div>

        {/* Time Information */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Elapsed: {elapsedTime}s</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Est. remaining: ~{estimatedTime}s</span>
          </div>
        </div>

        {/* Processing Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-blue-900 text-sm mb-1">Processing Time: 5-60 seconds</h4>
              <p className="text-blue-700 text-xs leading-relaxed">
                Processing time depends on report size and complexity. Our AI is carefully analyzing your medical data to ensure accuracy.
              </p>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>HIPAA Compliant • Secure Processing • End-to-End Encrypted</span>
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors duration-200"
          >
            Cancel Processing
          </button>
        )}
      </div>
    </div>
  );
}