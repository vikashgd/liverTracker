import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProcessingOverlay } from '../processing-overlay';

describe('ProcessingOverlay', () => {
  it('renders when visible', () => {
    render(<ProcessingOverlay isVisible={true} />);
    expect(screen.getByText('Processing Your Medical Report')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<ProcessingOverlay isVisible={false} />);
    expect(screen.queryByText('Processing Your Medical Report')).not.toBeInTheDocument();
  });

  it('shows custom message', () => {
    render(<ProcessingOverlay isVisible={true} message="Custom processing message" />);
    expect(screen.getByText('Custom processing message')).toBeInTheDocument();
  });

  it('shows progress bar when progress > 0', () => {
    render(<ProcessingOverlay isVisible={true} progress={50} />);
    const progressBar = document.querySelector('.bg-medical-primary-600');
    expect(progressBar).toHaveStyle('width: 50%');
  });

  it('calls onCancel when cancel button clicked', () => {
    const mockCancel = vi.fn();
    render(<ProcessingOverlay isVisible={true} onCancel={mockCancel} />);
    
    fireEvent.click(screen.getByText('Cancel Processing'));
    expect(mockCancel).toHaveBeenCalled();
  });
});