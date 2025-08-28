/**
 * Tests for Progress Indicator Component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ProgressIndicator, ProgressStep } from '../progress-indicator';
import { TabId } from '@/lib/upload-flow-state';

// Mock the CSS import
vi.mock('../progress-indicator.css', () => ({}));

// Clean up after each test
afterEach(() => {
  cleanup();
});

describe('ProgressStep', () => {
  it('should render step number and title', () => {
    render(
      <ProgressStep
        stepNumber={1}
        title="Upload & Preview"
        isActive={false}
        isCompleted={false}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Upload & Preview')).toBeInTheDocument();
  });

  it('should show check icon when completed', () => {
    const { container } = render(
      <ProgressStep
        stepNumber={1}
        title="Upload & Preview"
        isActive={false}
        isCompleted={true}
      />
    );

    // Check icon should be present, number should not
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    const checkIcon = container.querySelector('.progress-step__check-icon');
    expect(checkIcon).toBeInTheDocument();
  });

  it('should apply active styling class', () => {
    const { container } = render(
      <ProgressStep
        stepNumber={2}
        title="Review & Save"
        isActive={true}
        isCompleted={false}
      />
    );

    expect(container.firstChild).toHaveClass('progress-step--active');
  });

  it('should apply completed styling class', () => {
    const { container } = render(
      <ProgressStep
        stepNumber={3}
        title="Success"
        isActive={false}
        isCompleted={true}
      />
    );

    expect(container.firstChild).toHaveClass('progress-step--completed');
  });

  it('should handle click when clickable', () => {
    const handleClick = vi.fn();
    
    render(
      <ProgressStep
        stepNumber={1}
        title="Upload & Preview"
        isActive={false}
        isCompleted={false}
        isClickable={true}
        onClick={handleClick}
      />
    );

    const step = screen.getByRole('button');
    fireEvent.click(step);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should handle keyboard navigation when clickable', () => {
    const handleClick = vi.fn();
    
    render(
      <ProgressStep
        stepNumber={1}
        title="Upload & Preview"
        isActive={false}
        isCompleted={false}
        isClickable={true}
        onClick={handleClick}
      />
    );

    const step = screen.getByRole('button');
    
    // Test Enter key
    fireEvent.keyDown(step, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Test Space key
    fireEvent.keyDown(step, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
    
    // Test other key (should not trigger)
    fireEvent.keyDown(step, { key: 'Escape' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('should not be clickable when isClickable is false', () => {
    render(
      <ProgressStep
        stepNumber={1}
        title="Upload & Preview"
        isActive={false}
        isCompleted={false}
        isClickable={false}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <ProgressStep
        stepNumber={2}
        title="Review & Save"
        isActive={true}
        isCompleted={false}
        isClickable={true}
        onClick={() => {}}
      />
    );

    const step = screen.getByRole('button');
    expect(step).toHaveAttribute('aria-label', 'Step 2: Review & Save (current)');
    expect(step).toHaveAttribute('tabIndex', '0');
  });
});

describe('ProgressIndicator', () => {
  const defaultProps = {
    currentStep: 1 as TabId,
    completedSteps: [] as TabId[],
  };

  it('should render all three steps', () => {
    render(<ProgressIndicator {...defaultProps} />);

    expect(screen.getByText('Upload & Preview')).toBeInTheDocument();
    expect(screen.getByText('Review & Save')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('should show current step as active', () => {
    const { container } = render(
      <ProgressIndicator 
        currentStep={2}
        completedSteps={[1]}
      />
    );

    const steps = container.querySelectorAll('.progress-step');
    expect(steps[0]).toHaveClass('progress-step--completed');
    expect(steps[1]).toHaveClass('progress-step--active');
    expect(steps[2]).not.toHaveClass('progress-step--active');
    expect(steps[2]).not.toHaveClass('progress-step--completed');
  });

  it('should show completed steps with check icons', () => {
    const { container } = render(
      <ProgressIndicator 
        currentStep={3}
        completedSteps={[1, 2]}
      />
    );

    // Check for check icons in completed steps
    const checkIcons = container.querySelectorAll('.progress-step__check-icon');
    expect(checkIcons).toHaveLength(2); // Two completed steps should have check icons
    
    // Current step (3) should still show number
    const step3 = screen.getByLabelText(/Step 3.*current/);
    expect(step3.querySelector('.progress-step__number')).toHaveTextContent('3');
  });

  it('should handle step clicks when navigation is enabled', () => {
    const handleStepClick = vi.fn();
    const canNavigateToStep = vi.fn((step: TabId) => step <= 2);

    render(
      <ProgressIndicator 
        currentStep={2}
        completedSteps={[1]}
        onStepClick={handleStepClick}
        canNavigateToStep={canNavigateToStep}
      />
    );

    // Click on first step (should be clickable)
    const firstStep = screen.getByLabelText(/Step 1.*completed/);
    fireEvent.click(firstStep);
    expect(handleStepClick).toHaveBeenCalledWith(1);

    // Third step should not be clickable (no button role)
    const thirdStep = screen.getByLabelText(/Step 3/);
    expect(thirdStep).not.toHaveAttribute('role', 'button');
  });

  it('should not make steps clickable without navigation handlers', () => {
    render(
      <ProgressIndicator 
        currentStep={2}
        completedSteps={[1]}
      />
    );

    // No steps should be buttons without click handlers
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should have proper progressbar accessibility attributes', () => {
    const { container } = render(
      <ProgressIndicator 
        currentStep={2}
        completedSteps={[1]}
      />
    );

    const progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar).toHaveAttribute('aria-valuenow', '2');
    expect(progressbar).toHaveAttribute('aria-valuemin', '1');
    expect(progressbar).toHaveAttribute('aria-valuemax', '3');
    expect(progressbar).toHaveAttribute('aria-label', 'Upload progress: Step 2 of 3');
  });

  it('should render connector lines between steps', () => {
    const { container } = render(
      <ProgressIndicator 
        currentStep={2}
        completedSteps={[1]}
      />
    );

    const connectors = container.querySelectorAll('.progress-connector');
    expect(connectors).toHaveLength(2); // Between 3 steps, there are 2 connectors
  });

  it('should mark connectors as completed for completed steps', () => {
    const { container } = render(
      <ProgressIndicator 
        currentStep={3}
        completedSteps={[1, 2]}
      />
    );

    const connectors = container.querySelectorAll('.progress-connector');
    expect(connectors[0].className).toContain('progress-connector--completed'); // Between step 1 and 2
    expect(connectors[1].className).not.toContain('progress-connector--completed'); // Between step 2 and 3
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ProgressIndicator 
        {...defaultProps}
        className="custom-class"
      />
    );

    const progressIndicator = container.firstChild as HTMLElement;
    expect(progressIndicator.className).toContain('progress-indicator');
    expect(progressIndicator.className).toContain('custom-class');
  });

  it('should handle all steps completed', () => {
    const { container } = render(
      <ProgressIndicator 
        currentStep={3}
        completedSteps={[1, 2, 3]}
      />
    );

    // All steps should show check icons instead of numbers
    const checkIcons = container.querySelectorAll('.progress-step__check-icon');
    expect(checkIcons).toHaveLength(3);
    
    // No step numbers should be visible
    const stepNumbers = container.querySelectorAll('.progress-step__number');
    expect(stepNumbers).toHaveLength(0);
  });

  it('should handle edge case with no completed steps', () => {
    const { container } = render(
      <ProgressIndicator 
        currentStep={1}
        completedSteps={[]}
      />
    );

    // All steps should show numbers (no completed steps)
    const stepNumbers = container.querySelectorAll('.progress-step__number');
    expect(stepNumbers).toHaveLength(3);
    expect(stepNumbers[0]).toHaveTextContent('1');
    expect(stepNumbers[1]).toHaveTextContent('2');
    expect(stepNumbers[2]).toHaveTextContent('3');
    
    // No check icons should be present
    const checkIcons = container.querySelectorAll('.progress-step__check-icon');
    expect(checkIcons).toHaveLength(0);
  });
});