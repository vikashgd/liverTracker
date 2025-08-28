"use client";

import React, { useState } from 'react';
import { ProgressIndicator } from './progress-indicator';
import { TabId } from '@/lib/upload-flow-state';
import { Button } from '@/components/ui/button';
import './progress-indicator.css';

export function ProgressIndicatorDemo() {
  const [currentStep, setCurrentStep] = useState<TabId>(1);
  const [completedSteps, setCompletedSteps] = useState<TabId[]>([]);

  const canNavigateToStep = (step: TabId): boolean => {
    // Can navigate to completed steps or current step
    return completedSteps.includes(step) || step === currentStep;
  };

  const handleStepClick = (step: TabId) => {
    if (canNavigateToStep(step)) {
      setCurrentStep(step);
    }
  };

  const completeCurrentStep = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
  };

  const goToNextStep = () => {
    if (currentStep < 3) {
      completeCurrentStep();
      setCurrentStep((currentStep + 1) as TabId);
    }
  };

  const resetDemo = () => {
    setCurrentStep(1);
    setCompletedSteps([]);
  };

  return (
    <div className="space-y-8 p-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-medical-neutral-900 mb-2">
          Progress Indicator Demo
        </h2>
        <p className="text-medical-neutral-600">
          Interactive demo of the upload flow progress indicator
        </p>
      </div>

      {/* Progress Indicator */}
      <ProgressIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
        canNavigateToStep={canNavigateToStep}
      />

      {/* Demo Controls */}
      <div className="bg-medical-neutral-50 rounded-lg p-4">
        <h3 className="font-semibold text-medical-neutral-900 mb-3">Demo Controls</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={goToNextStep}
            disabled={currentStep === 3}
            className="btn-primary"
          >
            {currentStep === 3 ? 'All Steps Complete' : `Complete Step ${currentStep} & Continue`}
          </Button>
          
          <Button
            onClick={completeCurrentStep}
            disabled={completedSteps.includes(currentStep)}
            variant="outline"
          >
            Complete Current Step
          </Button>
          
          <Button
            onClick={resetDemo}
            variant="outline"
          >
            Reset Demo
          </Button>
        </div>
      </div>

      {/* State Display */}
      <div className="bg-white border border-medical-neutral-200 rounded-lg p-4">
        <h3 className="font-semibold text-medical-neutral-900 mb-3">Current State</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-medical-neutral-700">Current Step:</span>
            <span className="ml-2 text-medical-primary-600">{currentStep}</span>
          </div>
          <div>
            <span className="font-medium text-medical-neutral-700">Completed Steps:</span>
            <span className="ml-2 text-medical-success-600">
              {completedSteps.length > 0 ? completedSteps.join(', ') : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-medical-primary-50 border border-medical-primary-200 rounded-lg p-4">
        <h3 className="font-semibold text-medical-primary-900 mb-2">How to Use</h3>
        <ul className="text-sm text-medical-primary-800 space-y-1">
          <li>• Click "Complete Step & Continue" to progress through the flow</li>
          <li>• Click on completed steps to navigate back</li>
          <li>• Current step is highlighted with blue styling</li>
          <li>• Completed steps show green checkmarks</li>
          <li>• Connectors turn green when both connected steps are complete</li>
        </ul>
      </div>
    </div>
  );
}