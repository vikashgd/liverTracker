import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadFlowTabs } from '../upload-flow-tabs';
import { UploadFlowState } from '@/lib/upload-flow-state';

// Mock the child components
vi.mock('../progress-indicator', () => ({
  ProgressIndicator: ({ currentStep }: { currentStep: number }) => (
    <div data-testid="progress-indicator">Step {currentStep}</div>
  )
}));

vi.mock('../upload-preview-tab', () => ({
  UploadPreviewTab: ({ onNext }: { onNext: () => void }) => (
    <div data-testid="upload-preview-tab">
      <button onClick={onNext}>Next from Tab 1</button>
    </div>
  )
}));

describe('UploadFlowTabs', () => {
  const mockProps = {
    flowState: {
      currentTab: 1,
      uploadedFiles: [],
      extractedData: null,
      isProcessing: false,
      isSaving: false,
      savedId: null,
      error: null
    } as UploadFlowState,
    onFlowStateChange: vi.fn(),
    onFilesSelected: vi.fn(),
    onFileRemoved: vi.fn(),
    onClearAllFiles: vi.fn(),
    onProcessFiles: vi.fn(),
    onSaveReport: vi.fn(),
    onResetFlow: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders progress indicator', () => {
      render(<UploadFlowTabs {...mockProps} />);
      
      expect(screen.getByTestId('progress-indicator')).toBeInTheDocument();
      expect(screen.getByText('Step 1')).toBeInTheDocument();
    });

    it('renders tab 1 content by default', () => {
      render(<UploadFlowTabs {...mockProps} />);
      
      expect(screen.getByTestId('upload-preview-tab')).toBeInTheDocument();
    });

    it('does not show back button on first tab', () => {
      render(<UploadFlowTabs {...mockProps} />);
      
      expect(screen.queryByText('Back')).not.toBeInTheDocument();
    });

    it('does not show next button on last tab', () => {
      const flowState = { ...mockProps.flowState, currentTab: 3 as const };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      expect(screen.queryByText(/Process Files|Save Report|Complete/)).not.toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('shows tab 2 content when on tab 2', () => {
      const flowState = { ...mockProps.flowState, currentTab: 2 as const };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      expect(screen.getByText('Processing & Review')).toBeInTheDocument();
    });

    it('shows tab 3 content when on tab 3', () => {
      const flowState = { ...mockProps.flowState, currentTab: 3 as const };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    it('shows back button on tab 2', () => {
      const flowState = { ...mockProps.flowState, currentTab: 2 as const };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('shows back button on tab 3', () => {
      const flowState = { ...mockProps.flowState, currentTab: 3 as const };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  describe('Next Button Behavior', () => {
    it('shows "Process Files" on tab 1', () => {
      const flowState = {
        ...mockProps.flowState,
        uploadedFiles: [new File(['test'], 'test.pdf')]
      };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      expect(screen.getByText('Process Files')).toBeInTheDocument();
    });

    it('shows "Save Report" on tab 2', () => {
      const flowState = {
        ...mockProps.flowState,
        currentTab: 2 as const,
        extractedData: { reportType: 'Blood Test' }
      };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      expect(screen.getByText('Save Report')).toBeInTheDocument();
    });

    it('shows "Saving..." when saving', () => {
      const flowState = {
        ...mockProps.flowState,
        currentTab: 2 as const,
        extractedData: { reportType: 'Blood Test' },
        isSaving: true
      };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('calls onProcessFiles when next clicked on tab 1', () => {
      const flowState = {
        ...mockProps.flowState,
        uploadedFiles: [new File(['test'], 'test.pdf')]
      };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      const nextButton = screen.getByText('Process Files');
      fireEvent.click(nextButton);
      
      expect(mockProps.onProcessFiles).toHaveBeenCalledTimes(1);
    });

    it('calls onSaveReport when next clicked on tab 2', () => {
      const flowState = {
        ...mockProps.flowState,
        currentTab: 2 as const,
        extractedData: { reportType: 'Blood Test' }
      };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      const nextButton = screen.getByText('Save Report');
      fireEvent.click(nextButton);
      
      expect(mockProps.onSaveReport).toHaveBeenCalledTimes(1);
    });
  });

  describe('Back Button Behavior', () => {
    it('navigates back when back button clicked', () => {
      const flowState = { ...mockProps.flowState, currentTab: 2 as const };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);
      
      expect(mockProps.onFlowStateChange).toHaveBeenCalledWith({
        currentTab: 1,
        error: null
      });
    });

    it('disables back button when processing', () => {
      const flowState = {
        ...mockProps.flowState,
        currentTab: 2 as const,
        isProcessing: true
      };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeDisabled();
    });

    it('disables back button when saving', () => {
      const flowState = {
        ...mockProps.flowState,
        currentTab: 2 as const,
        isSaving: true
      };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeDisabled();
    });
  });

  describe('Processing State', () => {
    it('shows processing indicator when processing', () => {
      const flowState = {
        ...mockProps.flowState,
        currentTab: 2 as const,
        isProcessing: true
      };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      expect(screen.getByText('Processing your files with AI...')).toBeInTheDocument();
    });

    it('shows extracted data when processing complete', () => {
      const flowState = {
        ...mockProps.flowState,
        currentTab: 2 as const,
        extractedData: { reportType: 'Blood Test' }
      };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      expect(screen.getByText('✓ Processing complete! Data extracted successfully.')).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('shows success message when report saved', () => {
      const flowState = {
        ...mockProps.flowState,
        currentTab: 3 as const,
        savedId: 'test-report-id'
      };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      expect(screen.getByText('✅ Report saved successfully! ID: test-report-id')).toBeInTheDocument();
    });

    it('calls onResetFlow when upload another clicked', () => {
      const flowState = {
        ...mockProps.flowState,
        currentTab: 3 as const,
        savedId: 'test-report-id'
      };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      const uploadAnotherButton = screen.getByText('Upload Another Report');
      fireEvent.click(uploadAnotherButton);
      
      expect(mockProps.onResetFlow).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('displays error message when error exists', () => {
      const flowState = {
        ...mockProps.flowState,
        error: 'Upload failed. Please try again.'
      };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      expect(screen.getByText('Upload failed. Please try again.')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('does not display error section when no error', () => {
      render(<UploadFlowTabs {...mockProps} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('disables next button when no files on tab 1', () => {
      render(<UploadFlowTabs {...mockProps} />);
      
      // Next button should be disabled when no files
      const nextButton = screen.getByText('Process Files');
      expect(nextButton.closest('button')).toBeDisabled();
    });

    it('enables next button when files present on tab 1', () => {
      const flowState = {
        ...mockProps.flowState,
        uploadedFiles: [new File(['test'], 'test.pdf')]
      };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      const nextButton = screen.getByText('Process Files');
      expect(nextButton.closest('button')).not.toBeDisabled();
    });

    it('disables next button when processing', () => {
      const flowState = {
        ...mockProps.flowState,
        uploadedFiles: [new File(['test'], 'test.pdf')],
        isProcessing: true
      };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      // Should show loading state
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('disables next button when no extracted data on tab 2', () => {
      const flowState = { ...mockProps.flowState, currentTab: 2 as const };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      // Next button should be disabled when no extracted data
      const nextButton = screen.getByText('Save Report');
      expect(nextButton.closest('button')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for error messages', () => {
      const flowState = {
        ...mockProps.flowState,
        error: 'Test error message'
      };
      render(<UploadFlowTabs {...mockProps} flowState={flowState} />);
      
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <UploadFlowTabs {...mockProps} className="custom-class" />
      );
      
      const mainElement = container.querySelector('.upload-flow-tabs');
      expect(mainElement).toHaveClass('custom-class');
    });
  });
});