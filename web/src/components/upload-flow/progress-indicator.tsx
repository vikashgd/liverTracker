"use client";

import React from 'react';
import { TabId } from '@/lib/upload-flow-state';
import { getTabTitle } from '@/lib/upload-flow-utils';
import { Check } from 'lucide-react';

export interface ProgressStepProps {
  stepNumber: TabId;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
  isClickable?: boolean;
  onClick?: () => void;
}

export function ProgressStep({ 
  stepNumber, 
  title, 
  isActive, 
  isCompleted, 
  isClickable = false,
  onClick 
}: ProgressStepProps) {
  const handleClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`
        progress-step
        ${isActive ? 'progress-step--active' : ''}
        ${isCompleted ? 'progress-step--completed' : ''}
        ${isClickable ? 'progress-step--clickable' : ''}
      `}
      onClick={handleClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Step ${stepNumber}: ${title}${isActive ? ' (current)' : ''}${isCompleted ? ' (completed)' : ''}`}
    >
      {/* Step Circle */}
      <div className="progress-step__circle">
        {isCompleted ? (
          <Check className="progress-step__check-icon" size={16} />
        ) : (
          <span className="progress-step__number">{stepNumber}</span>
        )}
      </div>
      
      {/* Step Label */}
      <div className="progress-step__label">
        <span className="progress-step__title">{title}</span>
      </div>
    </div>
  );
}

export interface ProgressIndicatorProps {
  currentStep: TabId;
  completedSteps: TabId[];
  onStepClick?: (step: TabId) => void;
  canNavigateToStep?: (step: TabId) => boolean;
  className?: string;
}

export function ProgressIndicator({ 
  currentStep, 
  completedSteps, 
  onStepClick,
  canNavigateToStep,
  className = '' 
}: ProgressIndicatorProps) {
  const steps: TabId[] = [1, 2, 3];

  const isStepCompleted = (step: TabId) => completedSteps.includes(step);
  const isStepActive = (step: TabId) => step === currentStep;
  const isStepClickable = (step: TabId) => {
    return !!(onStepClick && canNavigateToStep && canNavigateToStep(step));
  };

  const handleStepClick = (step: TabId) => {
    if (onStepClick && canNavigateToStep && canNavigateToStep(step)) {
      onStepClick(step);
    }
  };

  return (
    <div 
      className={`progress-indicator ${className}`}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={3}
      aria-label={`Upload progress: Step ${currentStep} of 3`}
    >
      <div className="progress-indicator__container">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <ProgressStep
              stepNumber={step}
              title={getTabTitle(step)}
              isActive={isStepActive(step)}
              isCompleted={isStepCompleted(step)}
              isClickable={isStepClickable(step)}
              onClick={() => handleStepClick(step)}
            />
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div 
                className={`
                  progress-connector
                  ${isStepCompleted(step) && isStepCompleted(steps[index + 1]) ? 'progress-connector--completed' : ''}
                `}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}