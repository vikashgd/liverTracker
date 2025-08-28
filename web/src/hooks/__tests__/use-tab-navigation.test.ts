import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useTabNavigation } from '../use-tab-navigation';
import { UploadFlowState } from '@/lib/upload-flow-state';

describe('useTabNavigation', () => {
  const mockUpdateFlowState = vi.fn();
  const mockOnTabChange = vi.fn();

  const defaultFlowState: UploadFlowState = {
    currentTab: 1,
    uploadedFiles: [],
    extractedData: null,
    isProcessing: false,
    isSaving: false,
    savedId: null,
    error: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Navigation Functions', () => {
    it('navigates to target tab', () => {
      const { result } = renderHook(() =>
        useTabNavigation(defaultFlowState, mockUpdateFlowState, {
          onTabChange: mockOnTabChange
        })
      );

      act(() => {
        result.current.navigateToTab(2);
      });

      expect(mockUpdateFlowState).toHaveBeenCalledWith({
        currentTab: 2,
        error: null
      });
      expect(mockOnTabChange).toHaveBeenCalledWith(2);
    });

    it('does not navigate to same tab', () => {
      const { result } = renderHook(() =>
        useTabNavigation(defaultFlowState, mockUpdateFlowState)
      );

      act(() => {
        result.current.navigateToTab(1);
      });

      expect(mockUpdateFlowState).not.toHaveBeenCalled();
    });

    it('goes to next tab', () => {
      const { result } = renderHook(() =>
        useTabNavigation(defaultFlowState, mockUpdateFlowState)
      );

      act(() => {
        result.current.goToNextTab();
      });

      expect(mockUpdateFlowState).toHaveBeenCalledWith({
        currentTab: 2,
        error: null
      });
    });

    it('goes to previous tab', () => {
      const flowState = { ...defaultFlowState, currentTab: 2 as const };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      act(() => {
        result.current.goToPreviousTab();
      });

      expect(mockUpdateFlowState).toHaveBeenCalledWith({
        currentTab: 1,
        error: null
      });
    });

    it('does not go beyond last tab', () => {
      const flowState = { ...defaultFlowState, currentTab: 3 as const };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      act(() => {
        result.current.goToNextTab();
      });

      // Should not call updateFlowState since navigating to the same tab (3) is ignored
      expect(mockUpdateFlowState).not.toHaveBeenCalled();
    });

    it('does not go before first tab', () => {
      const { result } = renderHook(() =>
        useTabNavigation(defaultFlowState, mockUpdateFlowState)
      );

      act(() => {
        result.current.goToPreviousTab();
      });

      // Should not call updateFlowState since navigating to the same tab (1) is ignored
      expect(mockUpdateFlowState).not.toHaveBeenCalled();
    });
  });

  describe('Validation Functions', () => {
    it('allows navigation to previous tabs', () => {
      const flowState = { ...defaultFlowState, currentTab: 3 as const };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      expect(result.current.canNavigateToTab(1)).toBe(true);
      expect(result.current.canNavigateToTab(2)).toBe(true);
    });

    it('prevents navigation to tab 2 without files', () => {
      const { result } = renderHook(() =>
        useTabNavigation(defaultFlowState, mockUpdateFlowState)
      );

      expect(result.current.canNavigateToTab(2)).toBe(false);
    });

    it('allows navigation to tab 2 with files', () => {
      const flowState = {
        ...defaultFlowState,
        uploadedFiles: [new File(['test'], 'test.pdf')]
      };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      expect(result.current.canNavigateToTab(2)).toBe(true);
    });

    it('prevents navigation to tab 3 without extracted data', () => {
      const flowState = { ...defaultFlowState, currentTab: 2 as const };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      expect(result.current.canNavigateToTab(3)).toBe(false);
    });

    it('allows navigation to tab 3 with extracted data', () => {
      const flowState = {
        ...defaultFlowState,
        currentTab: 2 as const,
        extractedData: { reportType: 'Blood Test' }
      };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      expect(result.current.canNavigateToTab(3)).toBe(true);
    });

    it('prevents navigation to tab 3 while processing', () => {
      const flowState = {
        ...defaultFlowState,
        currentTab: 2 as const,
        extractedData: { reportType: 'Blood Test' },
        isProcessing: true
      };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      expect(result.current.canNavigateToTab(3)).toBe(false);
    });
  });

  describe('Next/Back Button States', () => {
    it('enables next button on tab 1 with files', () => {
      const flowState = {
        ...defaultFlowState,
        uploadedFiles: [new File(['test'], 'test.pdf')]
      };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      expect(result.current.canGoNext()).toBe(true);
    });

    it('disables next button on tab 1 without files', () => {
      const { result } = renderHook(() =>
        useTabNavigation(defaultFlowState, mockUpdateFlowState)
      );

      expect(result.current.canGoNext()).toBe(false);
    });

    it('disables next button while processing', () => {
      const flowState = {
        ...defaultFlowState,
        uploadedFiles: [new File(['test'], 'test.pdf')],
        isProcessing: true
      };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      expect(result.current.canGoNext()).toBe(false);
    });

    it('enables next button on tab 2 with extracted data', () => {
      const flowState = {
        ...defaultFlowState,
        currentTab: 2 as const,
        extractedData: { reportType: 'Blood Test' }
      };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      expect(result.current.canGoNext()).toBe(true);
    });

    it('disables next button on tab 3', () => {
      const flowState = { ...defaultFlowState, currentTab: 3 as const };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      expect(result.current.canGoNext()).toBe(false);
    });

    it('disables back button on tab 1', () => {
      const { result } = renderHook(() =>
        useTabNavigation(defaultFlowState, mockUpdateFlowState)
      );

      expect(result.current.canGoBack()).toBe(false);
    });

    it('enables back button on tab 2', () => {
      const flowState = { ...defaultFlowState, currentTab: 2 as const };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      expect(result.current.canGoBack()).toBe(true);
    });

    it('disables back button while processing', () => {
      const flowState = {
        ...defaultFlowState,
        currentTab: 2 as const,
        isProcessing: true
      };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      expect(result.current.canGoBack()).toBe(false);
    });
  });

  describe('Reset Flow', () => {
    it('resets flow to initial state', () => {
      const flowState = {
        ...defaultFlowState,
        currentTab: 3 as const,
        uploadedFiles: [new File(['test'], 'test.pdf')],
        extractedData: { reportType: 'Blood Test' },
        savedId: 'test-id'
      };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState, {
          onTabChange: mockOnTabChange
        })
      );

      act(() => {
        result.current.resetFlow();
      });

      expect(mockUpdateFlowState).toHaveBeenCalledWith({
        currentTab: 1,
        uploadedFiles: [],
        extractedData: null,
        isProcessing: false,
        isSaving: false,
        savedId: null,
        error: null
      });
      expect(mockOnTabChange).toHaveBeenCalledWith(1);
    });
  });

  describe('Validation Messages', () => {
    it('returns null for valid navigation', () => {
      const flowState = {
        ...defaultFlowState,
        uploadedFiles: [new File(['test'], 'test.pdf')]
      };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      expect(result.current.getTabValidationMessage(2)).toBeNull();
    });

    it('returns message for tab 2 without files', () => {
      const { result } = renderHook(() =>
        useTabNavigation(defaultFlowState, mockUpdateFlowState)
      );

      expect(result.current.getTabValidationMessage(2)).toBe(
        'Please select files before proceeding'
      );
    });

    it('returns message for tab 3 while processing', () => {
      const flowState = {
        ...defaultFlowState,
        currentTab: 2 as const,
        isProcessing: true
      };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      expect(result.current.getTabValidationMessage(3)).toBe(
        'Please wait for processing to complete'
      );
    });

    it('returns message for tab 3 without data', () => {
      const flowState = { ...defaultFlowState, currentTab: 2 as const };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      expect(result.current.getTabValidationMessage(3)).toBe(
        'No data available to review'
      );
    });
  });

  describe('State Properties', () => {
    it('returns correct current tab', () => {
      const flowState = { ...defaultFlowState, currentTab: 2 as const };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      expect(result.current.currentTab).toBe(2);
    });

    it('identifies first tab correctly', () => {
      const { result } = renderHook(() =>
        useTabNavigation(defaultFlowState, mockUpdateFlowState)
      );

      expect(result.current.isFirstTab).toBe(true);
    });

    it('identifies last tab correctly', () => {
      const flowState = { ...defaultFlowState, currentTab: 3 as const };
      const { result } = renderHook(() =>
        useTabNavigation(flowState, mockUpdateFlowState)
      );

      expect(result.current.isLastTab).toBe(true);
    });
  });

  describe('Custom Validation', () => {
    it('uses custom validation function', () => {
      const mockValidator = vi.fn().mockReturnValue(false);
      const { result } = renderHook(() =>
        useTabNavigation(defaultFlowState, mockUpdateFlowState, {
          validateTabTransition: mockValidator
        })
      );

      act(() => {
        result.current.navigateToTab(2);
      });

      expect(mockValidator).toHaveBeenCalledWith(1, 2, defaultFlowState);
      expect(mockUpdateFlowState).not.toHaveBeenCalled();
    });

    it('allows navigation when custom validation passes', () => {
      const mockValidator = vi.fn().mockReturnValue(true);
      const { result } = renderHook(() =>
        useTabNavigation(defaultFlowState, mockUpdateFlowState, {
          validateTabTransition: mockValidator
        })
      );

      act(() => {
        result.current.navigateToTab(2);
      });

      expect(mockValidator).toHaveBeenCalledWith(1, 2, defaultFlowState);
      expect(mockUpdateFlowState).toHaveBeenCalled();
    });
  });
});