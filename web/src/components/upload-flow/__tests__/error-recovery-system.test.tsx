import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorRecoverySystem, useErrorRecovery } from '../error-recovery-system';

describe('ErrorRecoverySystem', () => {
  const defaultProps = {
    error: 'Test error message',
    onRetry: vi.fn(),
    onDismiss: vi.fn(),
    onFallback: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error message correctly', () => {
    render(<ErrorRecoverySystem {...defaultProps} />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('does not render when no error', () => {
    render(<ErrorRecoverySystem {...defaultProps} error={null} />);
    expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
  });

  it('shows network error styling for network errors', () => {
    render(<ErrorRecoverySystem {...defaultProps} errorType="network" />);
    expect(screen.getByText('Connection Issue')).toBeInTheDocument();
    expect(screen.getByText('Please check your internet connection and try again.')).toBeInTheDocument();
  });

  it('shows processing error styling for processing errors', () => {
    render(<ErrorRecoverySystem {...defaultProps} errorType="processing" />);
    expect(screen.getByText('Processing Failed')).toBeInTheDocument();
    expect(screen.getByText('We encountered an issue processing your files. Please try again.')).toBeInTheDocument();
  });

  it('shows upload error styling for upload errors', () => {
    render(<ErrorRecoverySystem {...defaultProps} errorType="upload" />);
    expect(screen.getByText('Upload Failed')).toBeInTheDocument();
    expect(screen.getByText('File upload was interrupted. Please try uploading again.')).toBeInTheDocument();
  });

  it('shows validation error styling for validation errors', () => {
    render(<ErrorRecoverySystem {...defaultProps} errorType="validation" />);
    expect(screen.getByText('Validation Error')).toBeInTheDocument();
    expect(screen.getByText('Please check your input and try again.')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    render(<ErrorRecoverySystem {...defaultProps} />);
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(defaultProps.onRetry).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    render(<ErrorRecoverySystem {...defaultProps} />);
    
    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);
    
    expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows retry count when retryCount > 0', () => {
    render(<ErrorRecoverySystem {...defaultProps} retryCount={2} maxRetries={3} />);
    expect(screen.getByText('Attempt 3 of 4')).toBeInTheDocument();
  });

  it('hides retry button when max retries reached', () => {
    render(<ErrorRecoverySystem {...defaultProps} retryCount={3} maxRetries={3} />);
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('shows fallback button when max retries reached and showFallback is true', () => {
    render(
      <ErrorRecoverySystem 
        {...defaultProps} 
        retryCount={3} 
        maxRetries={3} 
        showFallback={true} 
      />
    );
    expect(screen.getByText('Use Alternative Method')).toBeInTheDocument();
  });

  it('calls onFallback when fallback button is clicked', () => {
    render(
      <ErrorRecoverySystem 
        {...defaultProps} 
        retryCount={3} 
        maxRetries={3} 
        showFallback={true} 
      />
    );
    
    const fallbackButton = screen.getByText('Use Alternative Method');
    fireEvent.click(fallbackButton);
    
    expect(defaultProps.onFallback).toHaveBeenCalledTimes(1);
  });

  it('shows loading state during retry', async () => {
    const slowRetry = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<ErrorRecoverySystem {...defaultProps} onRetry={slowRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    
    expect(screen.getByText('Retrying...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });
});

describe('useErrorRecovery', () => {
  function TestComponent() {
    const { error, errorType, retryCount, showError, clearError, incrementRetry } = useErrorRecovery();
    
    return (
      <div>
        <div data-testid="error">{error}</div>
        <div data-testid="error-type">{errorType}</div>
        <div data-testid="retry-count">{retryCount}</div>
        <button onClick={() => showError('Test error', 'network')}>Show Error</button>
        <button onClick={clearError}>Clear Error</button>
        <button onClick={incrementRetry}>Increment Retry</button>
      </div>
    );
  }

  it('initializes with no error', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('error')).toHaveTextContent('');
    expect(screen.getByTestId('retry-count')).toHaveTextContent('0');
  });

  it('shows error when showError is called', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Show Error'));
    
    expect(screen.getByTestId('error')).toHaveTextContent('Test error');
    expect(screen.getByTestId('error-type')).toHaveTextContent('network');
  });

  it('clears error when clearError is called', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Show Error'));
    expect(screen.getByTestId('error')).toHaveTextContent('Test error');
    
    fireEvent.click(screen.getByText('Clear Error'));
    expect(screen.getByTestId('error')).toHaveTextContent('');
    expect(screen.getByTestId('retry-count')).toHaveTextContent('0');
  });

  it('increments retry count', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Increment Retry'));
    expect(screen.getByTestId('retry-count')).toHaveTextContent('1');
    
    fireEvent.click(screen.getByText('Increment Retry'));
    expect(screen.getByTestId('retry-count')).toHaveTextContent('2');
  });

  it('resets retry count when showing new error', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Increment Retry'));
    expect(screen.getByTestId('retry-count')).toHaveTextContent('1');
    
    fireEvent.click(screen.getByText('Show Error'));
    expect(screen.getByTestId('retry-count')).toHaveTextContent('0');
  });
});