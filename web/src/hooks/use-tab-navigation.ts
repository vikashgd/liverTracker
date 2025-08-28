import { useCallback } from "react";
import { UploadFlowState } from "@/lib/upload-flow-state";

export interface TabNavigationOptions {
  onTabChange?: (tab: 1 | 2 | 3) => void;
  validateTabTransition?: (fromTab: 1 | 2 | 3, toTab: 1 | 2 | 3, state: UploadFlowState) => boolean;
}

export function useTabNavigation(
  flowState: UploadFlowState,
  updateFlowState: (updates: Partial<UploadFlowState>) => void,
  options: TabNavigationOptions = {}
) {
  const { onTabChange, validateTabTransition } = options;

  // Navigate to a specific tab
  const navigateToTab = useCallback((targetTab: 1 | 2 | 3) => {
    const currentTab = flowState.currentTab;
    
    // Don't navigate if already on target tab
    if (currentTab === targetTab) return;

    // Validate transition if validator provided
    if (validateTabTransition && !validateTabTransition(currentTab, targetTab, flowState)) {
      return;
    }

    // Update state
    updateFlowState({ 
      currentTab: targetTab,
      error: null // Clear any existing errors when navigating
    });

    // Call callback if provided
    onTabChange?.(targetTab);
  }, [flowState.currentTab, updateFlowState, onTabChange, validateTabTransition, flowState]);

  // Navigate to next tab
  const goToNextTab = useCallback(() => {
    const nextTab = Math.min(flowState.currentTab + 1, 3) as 1 | 2 | 3;
    navigateToTab(nextTab);
  }, [flowState.currentTab, navigateToTab]);

  // Navigate to previous tab
  const goToPreviousTab = useCallback(() => {
    const prevTab = Math.max(flowState.currentTab - 1, 1) as 1 | 2 | 3;
    navigateToTab(prevTab);
  }, [flowState.currentTab, navigateToTab]);

  // Check if navigation to a specific tab is allowed
  const canNavigateToTab = useCallback((targetTab: 1 | 2 | 3) => {
    const currentTab = flowState.currentTab;
    
    // Always allow going back
    if (targetTab < currentTab) return true;
    
    // Check if we can advance based on current state
    switch (currentTab) {
      case 1:
        // Can go to tab 2 if files are selected
        return targetTab === 2 ? flowState.uploadedFiles.length > 0 : false;
      case 2:
        // Can go to tab 3 if processing is complete and data exists
        return targetTab === 3 ? !flowState.isProcessing && flowState.extractedData !== null : false;
      case 3:
        // Already at final tab
        return false;
      default:
        return false;
    }
  }, [flowState]);

  // Check if next button should be enabled
  const canGoNext = useCallback(() => {
    switch (flowState.currentTab) {
      case 1:
        return flowState.uploadedFiles.length > 0 && !flowState.isProcessing;
      case 2:
        return flowState.extractedData !== null && !flowState.isSaving;
      case 3:
        return false; // No next from final tab
      default:
        return false;
    }
  }, [flowState]);

  // Check if back button should be enabled
  const canGoBack = useCallback(() => {
    return flowState.currentTab > 1 && !flowState.isProcessing && !flowState.isSaving;
  }, [flowState.currentTab, flowState.isProcessing, flowState.isSaving]);

  // Reset flow to first tab
  const resetFlow = useCallback(() => {
    updateFlowState({
      currentTab: 1,
      uploadedFiles: [],
      extractedData: null,
      isProcessing: false,
      isSaving: false,
      savedId: null,
      error: null
    });
    onTabChange?.(1);
  }, [updateFlowState, onTabChange]);

  // Get tab validation message
  const getTabValidationMessage = useCallback((targetTab: 1 | 2 | 3) => {
    if (canNavigateToTab(targetTab)) return null;

    switch (targetTab) {
      case 2:
        if (flowState.uploadedFiles.length === 0) {
          return "Please select files before proceeding";
        }
        break;
      case 3:
        if (flowState.isProcessing) {
          return "Please wait for processing to complete";
        }
        if (!flowState.extractedData) {
          return "No data available to review";
        }
        break;
    }
    return "Cannot navigate to this tab";
  }, [canNavigateToTab, flowState]);

  return {
    // Navigation functions
    navigateToTab,
    goToNextTab,
    goToPreviousTab,
    resetFlow,
    
    // Validation functions
    canNavigateToTab,
    canGoNext,
    canGoBack,
    getTabValidationMessage,
    
    // Current state
    currentTab: flowState.currentTab,
    isFirstTab: flowState.currentTab === 1,
    isLastTab: flowState.currentTab === 3,
  };
}