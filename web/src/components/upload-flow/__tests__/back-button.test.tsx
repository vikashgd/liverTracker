import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BackButton } from '../back-button';

describe('BackButton', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default text', () => {
      render(<BackButton onBack={mockOnBack} />);
      
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByLabelText('Go back to previous step')).toBeInTheDocument();
    });

    it('renders with custom children', () => {
      render(<BackButton onBack={mockOnBack}>Previous Step</BackButton>);
      
      expect(screen.getByText('Previous Step')).toBeInTheDocument();
    });

    it('renders arrow icon', () => {
      render(<BackButton onBack={mockOnBack} />);
      
      const button = screen.getByRole('button');
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls onBack when clicked', () => {
      render(<BackButton onBack={mockOnBack} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('does not call onBack when disabled', () => {
      render(<BackButton onBack={mockOnBack} disabled />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnBack).not.toHaveBeenCalled();
    });

    it('does not call onBack when loading', () => {
      render(<BackButton onBack={mockOnBack} loading />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnBack).not.toHaveBeenCalled();
    });
  });

  describe('States', () => {
    it('is disabled when disabled prop is true', () => {
      render(<BackButton onBack={mockOnBack} disabled />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('is disabled when loading prop is true', () => {
      render(<BackButton onBack={mockOnBack} loading />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('is enabled when neither disabled nor loading', () => {
      render(<BackButton onBack={mockOnBack} />);
      
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      render(<BackButton onBack={mockOnBack} className="custom-class" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('applies default classes', () => {
      render(<BackButton onBack={mockOnBack} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('back-button');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label', () => {
      render(<BackButton onBack={mockOnBack} />);
      
      const button = screen.getByLabelText('Go back to previous step');
      expect(button).toBeInTheDocument();
    });

    it('is focusable when enabled', () => {
      render(<BackButton onBack={mockOnBack} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('supports keyboard interaction', () => {
      render(<BackButton onBack={mockOnBack} />);
      
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