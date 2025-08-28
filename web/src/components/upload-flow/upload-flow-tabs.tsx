"use client";

import React, { useCallback } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ProgressIndicator } from "./progress-indicator";
import { UploadPreviewTab } from "./upload-preview-tab";
import { ProcessingReviewTab } from "./processing-review-tab";
import { SuccessTab } from "./success-tab";
import { BackButton } from "./back-button";
import { NextButton } from "./next-button";
import { ErrorBoundary } from "./error-boundary";
import { ErrorRecoverySystem, useErrorRecovery } from "./error-recovery-system";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { 
  useAccessibilityAnnouncer, 
  useKeyboardNavigation, 
  useFocusManagement,
  useReducedMotion 
} from "./accessibility-enhancements";
import { usePerformanceMonitoring, useMemoryManagement } from "@/hooks/use-performance-optimizations";
import { useSafeNavigation } from "@/lib/safe-navigation";
import { UploadFlowState } from "@/lib/upload-flow-state";
import { useTabNavigation } from "@/hooks/use-tab-navigation";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";

export interface UploadFlowTabsProps {
  flowState: UploadFlowState;
  onFlowStateChange: (updates: Partial<UploadFlowState>) => void;
  onFilesSelected: (files: File[]) => void;
  onFileRemoved: (index: number) => void;
  onClearAllFiles: () => void;
  onProcessFiles?: () => void;
  onSaveReport?: () => void;
  onResetFlow?: () => void;
  className?: string;
}

export function UploadFlowTabs({
  flowState,
  onFlowStateChange,
  onFilesSelected,
  onFileRemoved,
  onClearAllFiles,
  onProcessFiles,
  onSaveReport,
  onResetFlow,
  className = ""
}: UploadFlowTabsProps) {
  
  // Safe navigation hook
  const { navigate } = useSafeNavigation();
  
  const {
    navigateToTab,
    goToNextTab,
    goToPreviousTab,
    canGoNext,
    canGoBack,
    canNavigateToTab,
    resetFlow,
    currentTab,
    isFirstTab,
    isLastTab
  } = useTabNavigation(flowState, onFlowStateChange, {
    onTabChange: (tab) => {
      // Accessibility announcements for tab changes
      const tabNames = { 
        1: 'Upload and Preview', 
        2: 'Processing and Review', 
        3: 'Success' 
      };
      announce(`Navigated to ${tabNames[tab]} tab`, 'polite');
      
      // Focus management
      setTimeout(() => {
        focusElement();
      }, 100);
      
      console.log(`Navigated to tab ${tab}`);
    }
  });

  // Error recovery system
  const {
    error: recoveryError,
    errorType,
    retryCount,
    showError,
    clearError,
    incrementRetry
  } = useErrorRecovery();

  // Network status monitoring
  const { isOnline, isSlowConnection, checkConnectivity } = useNetworkStatus();

  // Accessibility features
  const { announce, AnnouncerComponent } = useAccessibilityAnnouncer();
  const { focusRef, focusElement } = useFocusManagement();
  const prefersReducedMotion = useReducedMotion();

  // Performance monitoring
  const { revokeAllObjectUrls } = useMemoryManagement();
  const { metrics, measureRenderTime } = usePerformanceMonitoring();

  // Handle upload and extract action for Screen 1
  const handleUploadAndExtract = useCallback(async () => {
    clearError(); // Clear any previous errors
    
    // Check network connectivity
    if (!isOnline) {
      showError('No internet connection. Please check your network and try again.', 'network');
      return;
    }
    
    const isConnected = await checkConnectivity();
    if (!isConnected) {
      showError('Unable to connect to our servers. Please try again.', 'network');
      return;
    }

    try {
      // Validate files before processing
      if (!flowState.uploadedFiles || flowState.uploadedFiles.length === 0) {
        showError('Please select at least one file to process.', 'validation');
        return;
      }
      
      // Start processing files and advance to next tab
      onProcessFiles?.();
      goToNextTab();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      showError(errorMessage, 'generic');
    }
  }, [onProcessFiles, goToNextTab, flowState.uploadedFiles, isOnline, checkConnectivity, showError, clearError]);

  // Handle next button click based on current tab (for remaining generic navigation)
  const handleNext = useCallback(async () => {
    clearError(); // Clear any previous errors
    
    // Check network connectivity for operations that require it
    if (currentTab === 2) {
      if (!isOnline) {
        showError('No internet connection. Please check your network and try again.', 'network');
        return;
      }
      
      const isConnected = await checkConnectivity();
      if (!isConnected) {
        showError('Unable to connect to our servers. Please try again.', 'network');
        return;
      }
    }

    try {
      switch (currentTab) {
        case 2:
          // Validate extracted data before saving
          if (!flowState.extractedData) {
            showError('No data to save. Please process files first.', 'validation');
            return;
          }
          
          // Save report
          onSaveReport?.();
          break;
        case 3:
          // Already at final tab, no next action
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      showError(errorMessage, 'generic');
    }
  }, [currentTab, onSaveReport, flowState.extractedData, isOnline, checkConnectivity, showError, clearError]);

  // Handle back button click
  const handleBack = useCallback(() => {
    goToPreviousTab();
  }, [goToPreviousTab]);

  // Handle keyboard navigation based on current tab
  const handleKeyboardNext = useCallback(() => {
    if (currentTab === 1) {
      return handleUploadAndExtract();
    } else {
      return handleNext();
    }
  }, [currentTab, handleUploadAndExtract, handleNext]);

  // Keyboard navigation
  useKeyboardNavigation(
    canGoNext() ? handleKeyboardNext : undefined,
    canGoBack() ? handleBack : undefined,
    () => clearError()
  );

  // Mobile swipe navigation
  const swipeRef = useSwipeNavigation({
    onSwipeLeft: () => {
      if (canGoNext()) {
        if (currentTab === 1) {
          handleUploadAndExtract();
        } else {
          handleNext();
        }
      }
    },
    onSwipeRight: () => {
      if (canGoBack()) {
        handleBack();
      }
    },
    enabled: true
  });

  // Handle flow reset
  const handleReset = useCallback(() => {
    const endMeasure = measureRenderTime('UploadFlowTabs-Reset');
    
    clearError();
    revokeAllObjectUrls(); // Clean up memory
    resetFlow();
    onResetFlow?.();
    announce('Upload flow has been reset', 'polite');
    
    endMeasure();
  }, [resetFlow, onResetFlow, clearError, measureRenderTime, revokeAllObjectUrls, announce]);

  // Handle retry operations
  const handleRetry = useCallback(async () => {
    incrementRetry();
    
    try {
      switch (currentTab) {
        case 1:
          if (flowState.uploadedFiles && flowState.uploadedFiles.length > 0) {
            await handleUploadAndExtract();
          }
          break;
        case 2:
          if (flowState.extractedData) {
            onSaveReport?.();
          }
          break;
        default:
          // For other tabs, just clear the error
          clearError();
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Retry failed';
      showError(errorMessage, 'generic');
    }
  }, [currentTab, flowState.uploadedFiles, flowState.extractedData, handleUploadAndExtract, onSaveReport, incrementRetry, clearError, showError]);

  // Get next button text based on current tab
  const getNextButtonText = () => {
    switch (currentTab) {
      case 1:
        return "Process Files";
      case 2:
        return flowState.isSaving ? "Saving..." : "Save Report";
      case 3:
        return "Complete";
      default:
        return "Next";
    }
  };

  // Get loading state for next button
  const isNextLoading = () => {
    switch (currentTab) {
      case 1:
        return flowState.isProcessing;
      case 2:
        return flowState.isSaving;
      default:
        return false;
    }
  };

  return (
    <div 
      ref={swipeRef as React.RefObject<HTMLDivElement>} 
      className={`upload-flow-tabs ${className} ${prefersReducedMotion ? 'reduced-motion' : ''}`}
      role="main"
      aria-label="Medical report upload workflow"
      tabIndex={-1}
    >
      {/* Progress Indicator */}
      <div className="progress-section mb-6">
        <ProgressIndicator
          currentStep={currentTab}
          completedSteps={[]}
          onStepClick={canNavigateToTab(1) ? navigateToTab : undefined}
          canNavigateToStep={canNavigateToTab}
        />
      </div>

      {/* Tab Content */}
      <Tabs value={`tab-${currentTab}`} className="w-full">
        {/* Tab 1: Upload & Preview */}
        <TabsContent value="tab-1" className="tab-content">
          <div className="tab-container">
            <UploadPreviewTab
              flowState={flowState}
              onFilesSelected={onFilesSelected}
              onFileRemoved={onFileRemoved}
              onUploadAndExtract={handleUploadAndExtract}
              onClearAll={onClearAllFiles}
            />
          </div>
        </TabsContent>

        {/* Tab 2: Processing & Review */}
        <TabsContent value="tab-2" className="tab-content">
          <div className="tab-container">
            <ProcessingReviewTab
              flowState={flowState}
              onProcessingComplete={(data) => {
                onFlowStateChange({ extractedData: data, isProcessing: false });
              }}
              onCancelProcessing={() => {
                onFlowStateChange({ isProcessing: false, error: "Processing cancelled" });
                goToPreviousTab();
              }}
              onRescan={() => {
                // Clear data and return to Screen 1
                onFlowStateChange({ 
                  extractedData: null, 
                  editedData: null, 
                  isProcessing: false, 
                  error: null 
                });
                navigateToTab(1);
              }}
              onSaveReport={onSaveReport}
            />
          </div>
        </TabsContent>

        {/* Tab 3: Success */}
        <TabsContent value="tab-3" className="tab-content">
          <div className="tab-container">
            <SuccessTab
              savedId={flowState.savedId}
              reportData={flowState.extractedData}
              onUploadAnother={handleReset}
              onViewReport={(id) => {
                // Navigate to report details
                navigate(`/reports/${id}`);
              }}
            />
          </div>
        </TabsContent>
      </Tabs>



      {/* Error Display */}
      {(flowState.error || recoveryError) && (
        <div className="error-section mt-4">
          <ErrorRecoverySystem
            error={recoveryError || flowState.error}
            errorType={errorType}
            onRetry={handleRetry}
            onDismiss={() => {
              clearError();
              onFlowStateChange({ error: null });
            }}
            retryCount={retryCount}
            maxRetries={3}
            showFallback={retryCount >= 2}
            onFallback={() => {
              // Provide alternative methods based on context
              if (currentTab === 1) {
                // Suggest manual entry as fallback
                onFlowStateChange({ error: null });
                // Could navigate to manual entry mode
              } else if (currentTab === 2) {
                // Suggest downloading data as fallback
                onFlowStateChange({ error: null });
                // Could trigger download of extracted data
              }
            }}
          />
        </div>
      )}

      {/* Network Status Warning */}
      {!isOnline && (
        <div className="network-warning mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-orange-700">
              You're currently offline. Some features may not work properly.
            </span>
          </div>
        </div>
      )}

      {isSlowConnection && (
        <div className="connection-warning mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-yellow-700">
              Slow connection detected. Uploads may take longer than usual.
            </span>
          </div>
        </div>
      )}

      {/* Accessibility Announcer */}
      <AnnouncerComponent />

      {/* Performance Metrics (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="performance-metrics fixed bottom-4 left-4 bg-gray-800 text-white text-xs p-2 rounded opacity-75">
          <div>Render: {metrics.renderTime.toFixed(1)}ms</div>
          <div>Memory: {metrics.memoryUsage.toFixed(1)}MB</div>
        </div>
      )}
    </div>
  );
}