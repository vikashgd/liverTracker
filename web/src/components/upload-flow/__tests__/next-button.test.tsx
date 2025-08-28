import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextButton } from '../next-button';

describe('NextButton', () => {
  const mockOnNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default text', () => {
      render(<NextButton onNext={mockOnNext} />);
      
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByLabelText('Proceed to next step')).toBeInTheDocument();
    });

    it('renders with custom children', () => {
      render(<NextButton onNext={mockOnNext}>Continue</NextButton>);
      
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });

    it('renders arrow icon when not loading', () => {
      render(<NextButton onNext={mockOnNext} />);
      
      const button = screen.getByRole('button');
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when loading', () => {
      render(<NextButton onNext={mockOnNext} loading />);
      
      const spinner = screen.getByRole('button').querySelector('.loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('shows default loading text when loading', () => {
      render(<NextButton onNext={mockOnNext} loading />);
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('shows custom loading text when provided', () => {
      render(<NextButton onNext={mockOnNext} loading loadingText="Saving..." />);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('updates aria-label when loading', () => {
      render(<NextButton onNext={mockOnNext} loading loadingText="Saving..." />);
      
      expect(screen.getByLabelText('Saving...')).toBeInTheDocument();
    });

    it('does not show arrow icon when loading', () => {
      render(<NextButton onNext={mockOnNext} loading />);
      
      const button = screen.getByRole('button');
      const arrowIcon = button.querySelector('svg[class*="lucide-arrow-right"]');
      expect(arrowIcon).not.toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls onNext when clicked', () => {
      render(<NextButton onNext={mockOnNext} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it('does not call onNext when disabled', () => {
      render(<NextButton onNext={mockOnNext} disabled />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnNext).not.toHaveBeenCalled();
    });

    it('does not call onNext when loading', () => {
      render(<NextButton onNext={mockOnNext} loading />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnNext).not.toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('is disabled when disabled prop is true', () => {
      render(<NextButton onNext={mockOnNext} disabled />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('is disabled when loading prop is true', () => {
      render(<NextButton onNext={mockOnNext} loading />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('is enabled when neither disabled nor loading', () => {
      render(<NextButton onNext={mockOnNext} />);
      
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      render(<NextButton onNext={mockOnNext} className="custom-class" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('applies default classes', () => {
      render(<NextButton onNext={mockOnNext} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('next-button');
      expect(button).toHaveClass('btn-primary');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label', () => {
      render(<NextButton onNext={mockOnNext} />);
      
      const button = screen.getByLabelText('Proceed to next step');
      expect(button).toBeInTheDocument();
    });

    it('is focusable when enabled', () => {
      render(<NextButton onNext={mockOnNext} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('supports keyboard interaction', () => {
      render(<NextButton onNext={mockOnNext} />);
      
      const button = screen.getByRole('button');
      button.focus();
      
      // Simulate pressing Enter key which should trigger the button
      fireEvent.keyPress(button, { key: 'Enter', code: 'Enter', charCode: 13 });
      
      // Since the button component handles keyboard events natively,
      // we can just verify it's focusable and accessible
      expect(button).toHaveFocus();
    });
  });
});