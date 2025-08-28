import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadFlowTabs } from '../upload-flow-tabs';
import { UploadFlowState } from '@/lib/upload-flow-state';

// Mock all the dependencies
vi.mock('../progress-indicator', () => ({
  ProgressIndicator: ({ currentStep, onStepClick }: any) => (
    <div data-testid="progress-indicator">
      <div data-testid="current-step">{currentStep}</div>
      {onStepClick && <button onClick={() => onStepClick(1)}>Go to Step 1</button>}
    </div>
  )
}));

vi.mock('../upload-preview-tab', () => ({
  UploadPreviewTab: ({ onNext, onFilesSelected }: any) => (
    <div data-testid="upload-preview-tab">
      <button onClick={() => onFilesSelected([new File(['test'], 'test.jpg')])}>
        Select Files
      </button>
      <button onClick={onNext}>Next</button>
    </div>
  )
}));

vi.mock('../processing-review-tab', () => ({
  ProcessingReviewTab: ({ onProcessingComplete, onCancelProcessing }: any) => (
    <div data-testid="processing-review-tab">
      <button onClick={() => onProcessingComplete({ reportType: 'Test' })}>
        Complete Processing
      </button>
      <button onClick={onCancelProcessing}>Cancel</button>
    </div>
  )
}));

vi.mock('../success-tab', () => ({
  SuccessTab: ({ onUploadAnother, onViewReport, savedId }: any) => (
    <div data-testid="success-tab">
      <div data-testid="saved-id">{savedId}</div>
      <button onClick={onUploadAnother}>Upload Another</button>
      <button onClick={() => onViewReport('test-id')}>View Report</button>
    </div>
  )
}));

vi.mock('../back-button', () => ({
  BackButton: ({ onBack, disabled }: any) => (
    <button data-testid="back-button" onClick={onBack} disabled={disabled}>
      Back
    </button>
  )
}));

vi.mock('../next-button', () => ({
  NextButton: ({ onNext, disabled, loading, children }: any) => (
    <button data-testid="next-button" onClick={onNext} disabled={disabled}>
      {loading ? 'Loading...' : children}
    </button>
  )
}));

vi.mock('../error-boundary', () => ({
  ErrorBoundary: ({ children }: any) => <div>{children}</div>
}));

vi.mock('../error-recovery-system', () => ({
  ErrorRecoverySystem: ({ error, onRetry, onDismiss }: any) => (
    error ? (
      <div data-testid="error-recovery">
        <div data-testid="error-message">{error}</div>
        <button onClick={onRetry}>Retry</button>
        <button onClick={onDismiss}>Dismiss</button>
      </div>
    ) : null
  ),
  useErrorRecovery: () => ({
    error: null,
    errorType: 'generic',
    retryCount: 0,
    showError: vi.fn(),
    clearError: vi.fn(),
    incrementRetry: vi.fn()
  })
}));

vi.mock('@/hooks/use-network-status', () => ({
  useNetworkStatus: () => ({
    isOnline: true,
    isSlowConnection: false,
    checkConnectivity: vi.fn(() => Promise.resolve(true))
  })
}));

vi.mock('../accessibility-enhancements', () => ({
  useAccessibilityAnnouncer: () => ({
    announce: vi.fn(),
    AnnouncerComponent: () => <div data-testid="announcer" />
  }),
  useFocusManagement: () => ({
    focusRef: { current: null },
    focusElement: vi.fn()
  }),
  useReducedMotion: () => false
}));

vi.mock('@/hooks/use-performance-optimizations', () => ({
  useMemoryManagement: () => ({
    measureRenderTime: vi.fn(() => vi.fn()),
    revokeAllObjectUrls: vi.fn()
  }),
  usePerformanceMonitoring: () => ({
    metrics: { renderTime: 0, memoryUsage: 0 }
  })
}));

vi.mock('@/hooks/use-tab-navigation', () => ({
  useTabNavigation: (flowState: any, onFlowStateChange: any, options: any) => ({
    navigateToTab: vi.fn(),
    goToNextTab: vi.fn(() => {
      onFlowStateChange({ currentTab: flowState.currentTab + 1 });
    }),
    goToPreviousTab: vi.fn(() => {
      onFlowStateChange({ currentTab: flowState.currentTab - 1 });
    }),
    canGoNext: vi.fn(() => true),
    canGoBack: vi.fn(() => flowState.currentTab > 1),
    canNavigateToTab: vi.fn(() => true),
    resetFlow: vi.fn(() => {
      onFlowStateChange({ currentTab: 1, uploadedFiles: [], extractedData: null });
    }),
    currentTab: flowState.currentTab,
    isFirstTab: flowState.currentTab === 1,
    isLastTab: flowState.currentTab === 3
  })
}));

vi.mock('@/hooks/use-swipe-navigation', () => ({
  useSwipeNavigation: () => ({ current: null })
}));

describe('Upload Flow Integration Tests', () => {
  const mockOnFlowStateChange = vi.fn();
  const mockOnFilesSelected = vi.fn();
  const mockOnFileRemoved = vi.fn();
  const mockOnClearAllFiles = vi.fn();
  const mockOnProcessFiles = vi.fn();
  const mockOnSaveReport = vi.fn();
  const mockOnResetFlow = vi.fn();

  const defaultProps = {
    flowState: {
      currentTab: 1,
      uploadedFiles: [],
      extractedData: null,
      isProcessing: false,
      isSaving: false,
      savedId: null,
      error: null
    } as UploadFlowState,
    onFlowStateChange: mockOnFlowStateChange,
    onFilesSelected: mockOnFilesSelected,
    onFileRemoved: mockOnFileRemoved,
    onClearAllFiles: mockOnClearAllFiles,
    onProcessFiles: mockOnProcessFiles,
    onSaveReport: mockOnSaveReport,
    onResetFlow: mockOnResetFlow
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<UploadFlowTabs {...defaultProps} />);
    
    expect(screen.getByTestId('progress-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('current-step')).toHaveTextContent('1');
    expect(screen.getByTestId('upload-preview-tab')).toBeInTheDocument();
    expect(screen.getByTestId('next-button')).toBeInTheDocument();
    expect(screen.queryByTestId('back-button')).not.toBeInTheDocument();
  });

  it('navigates through complete workflow', async () => {
    const { rerender } = render(<UploadFlowTabs {...defaultProps} />);
    
    // Step 1: Upload files
    expect(screen.getByTestId('upload-preview-tab')).toBeInTheDocument();
    
    const selectFilesButton = screen.getByText('Select Files');
    fireEvent.click(selectFilesButton);
    expect(mockOnFilesSelected).toHaveBeenCalled();
    
    // Simulate files selected
    const propsWithFiles = {
      ...defaultProps,
      flowState: {
        ...defaultProps.flowState,
        uploadedFiles: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]
      }
    };
    rerender(<UploadFlowTabs {...propsWithFiles} />);
    
    const nextButton = screen.getByTestId('next-button');
    fireEvent.click(nextButton);
    expect(mockOnProcessFiles).toHaveBeenCalled();
    
    // Step 2: Processing and Review
    const propsTab2 = {
      ...propsWithFiles,
      flowState: {
        ...propsWithFiles.flowState,
        currentTab: 2,
        isProcessing: true
      }
    };
    rerender(<UploadFlowTabs {...propsTab2} />);
    
    expect(screen.getByTestId('processing-review-tab')).toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
    
    // Complete processing
    const completeButton = screen.getByText('Complete Processing');
    fireEvent.click(completeButton);
    expect(mockOnFlowStateChange).toHaveBeenCalledWith({
      extractedData: { reportType: 'Test' },
      isProcessing: false
    });
    
    // Save report
    const propsWithData = {
      ...propsTab2,
      flowState: {
        ...propsTab2.flowState,
        isProcessing: false,
        extractedData: { reportType: 'Test' }
      }
    };
    rerender(<UploadFlowTabs {...propsWithData} />);
    
    const saveButton = screen.getByTestId('next-button');
    fireEvent.click(saveButton);
    expect(mockOnSaveReport).toHaveBeenCalled();
    
    // Step 3: Success
    const propsTab3 = {
      ...propsWithData,
      flowState: {
        ...propsWithData.flowState,
        currentTab: 3,
        savedId: 'test-report-id'
      }
    };
    rerender(<UploadFlowTabs {...propsTab3} />);
    
    expect(screen.getByTestId('success-tab')).toBeInTheDocument();
    expect(screen.getByTestId('saved-id')).toHaveTextContent('test-report-id');
    
    // Reset flow
    const uploadAnotherButton = screen.getByText('Upload Another');
    fireEvent.click(uploadAnotherButton);
    expect(mockOnResetFlow).toHaveBeenCalled();
  });

  it('handles back navigation correctly', () => {
    const propsTab2 = {
      ...defaultProps,
      flowState: {
        ...defaultProps.flowState,
        currentTab: 2
      }
    };
    
    render(<UploadFlowTabs {...propsTab2} />);
    
    const backButton = screen.getByTestId('back-button');
    expect(backButton).toBeInTheDocument();
    expect(backButton).not.toBeDisabled();
    
    fireEvent.click(backButton);
    expect(mockOnFlowStateChange).toHaveBeenCalledWith({ currentTab: 1 });
  });

  it('displays errors correctly', () => {
    const propsWithError = {
      ...defaultProps,
      flowState: {
        ...defaultProps.flowState,
        error: 'Test error message'
      }
    };
    
    render(<UploadFlowTabs {...propsWithError} />);
    
    expect(screen.getByTestId('error-recovery')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toHaveTextContent('Test error message');
  });

  it('handles processing cancellation', () => {
    const propsProcessing = {
      ...defaultProps,
      flowState: {
        ...defaultProps.flowState,
        currentTab: 2,
        isProcessing: true
      }
    };
    
    render(<UploadFlowTabs {...propsProcessing} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnFlowStateChange).toHaveBeenCalledWith({
      isProcessing: false,
      error: 'Processing cancelled'
    });
  });

  it('disables navigation during processing', () => {
    const propsProcessing = {
      ...defaultProps,
      flowState: {
        ...defaultProps.flowState,
        currentTab: 2,
        isProcessing: true
      }
    };
    
    render(<UploadFlowTabs {...propsProcessing} />);
    
    const backButton = screen.getByTestId('back-button');
    const nextButton = screen.getByTestId('next-button');
    
    expect(backButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it('shows loading states correctly', () => {
    const propsLoading = {
      ...defaultProps,
      flowState: {
        ...defaultProps.flowState,
        currentTab: 2,
        isSaving: true
      }
    };
    
    render(<UploadFlowTabs {...propsLoading} />);
    
    const nextButton = screen.getByTestId('next-button');
    expect(nextButton).toHaveTextContent('Loading...');
  });

  it('handles keyboard navigation', () => {
    render(<UploadFlowTabs {...defaultProps} />);
    
    // Test keyboard events
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // Navigation should be handled by the keyboard navigation hook
    expect(screen.getByTestId('upload-preview-tab')).toBeInTheDocument();
  });

  it('announces accessibility changes', () => {
    render(<UploadFlowTabs {...defaultProps} />);
    
    expect(screen.getByTestId('announcer')).toBeInTheDocument();
  });

  it('handles network status changes', () => {
    // Mock offline state
    vi.mocked(require('@/hooks/use-network-status').useNetworkStatus).mockReturnValue({
      isOnline: false,
      isSlowConnection: false,
      checkConnectivity: vi.fn(() => Promise.resolve(false))
    });
    
    render(<UploadFlowTabs {...defaultProps} />);
    
    expect(screen.getByText(/currently offline/)).toBeInTheDocument();
  });

  it('handles slow connection warnings', () => {
    // Mock slow connection
    vi.mocked(require('@/hooks/use-network-status').useNetworkStatus).mockReturnValue({
      isOnline: true,
      isSlowConnection: true,
      checkConnectivity: vi.fn(() => Promise.resolve(true))
    });
    
    render(<UploadFlowTabs {...defaultProps} />);
    
    expect(screen.getByText(/Slow connection detected/)).toBeInTheDocument();
  });
});