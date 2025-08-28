/**
 * React hooks for managing upload flow state and navigation
 * Provides state management for the multi-step upload process
 */

import { useReducer, useCallback, useEffect } from 'react';
import { 
  UploadFlowState, 
  UploadFlowAction, 
  TabId, 
  TabTransition,
  ExtractionResult,
  createInitialUploadFlowState 
} from '@/lib/upload-flow-state';

// State reducer for upload flow
function uploadFlowReducer(state: UploadFlowState, action: UploadFlowAction): UploadFlowState {
  switch (action.type) {
    case 'SET_TAB':
      return {
        ...state,
        currentTab: action.payload,
        error: null, // Clear errors when navigating
      };

    case 'SET_FILES':
      return {
        ...state,
        uploadedFiles: action.payload,
        filePreviewUrls: action.payload.map(file => 
          file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
        ),
        extractedData: null,
        editedData: null,
        savedId: null,
        error: null,
        objectKey: null,
      };

    case 'ADD_FILES':
      const newFiles = [...state.uploadedFiles, ...action.payload];
      return {
        ...state,
        uploadedFiles: newFiles,
        filePreviewUrls: newFiles.map(file => 
          file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
        ),
        extractedData: null,
        editedData: null,
        savedId: null,
        error: null,
      };

    case 'REMOVE_FILE':
      const filteredFiles = state.uploadedFiles.filter((_, index) => index !== action.payload);
      // Clean up preview URLs
      if (state.filePreviewUrls[action.payload]) {
        URL.revokeObjectURL(state.filePreviewUrls[action.payload]);
      }
      return {
        ...state,
        uploadedFiles: filteredFiles,
        filePreviewUrls: filteredFiles.map(file => 
          file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
        ),
      };

    case 'START_PROCESSING':
      return {
        ...state,
        isProcessing: true,
        processingProgress: 0,
        showProcessingOverlay: true,
        error: null,
      };

    case 'SET_PROCESSING_PROGRESS':
      return {
        ...state,
        processingProgress: action.payload,
      };

    case 'COMPLETE_PROCESSING':
      return {
        ...state,
        isProcessing: false,
        processingProgress: 100,
        extractedData: action.payload,
        editedData: action.payload,
        showProcessingOverlay: false,
        currentTab: state.autoAdvanceEnabled ? 2 : state.currentTab,
      };

    case 'START_SAVING':
      return {
        ...state,
        isSaving: true,
        error: null,
      };

    case 'COMPLETE_SAVING':
      return {
        ...state,
        isSaving: false,
        savedId: action.payload,
        currentTab: state.autoAdvanceEnabled ? 3 : state.currentTab,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isProcessing: false,
        isSaving: false,
        showProcessingOverlay: false,
      };

    case 'SET_EDITED_DATA':
      return {
        ...state,
        editedData: action.payload,
      };

    case 'SHOW_PROCESSING_OVERLAY':
      return {
        ...state,
        showProcessingOverlay: action.payload,
      };

    case 'SET_OBJECT_KEY':
      return {
        ...state,
        objectKey: action.payload,
      };

    case 'RESET_FLOW':
      // Clean up any existing preview URLs
      state.filePreviewUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
      return createInitialUploadFlowState();

    default:
      return state;
  }
}

// Main hook for upload flow state management
export function useUploadFlow() {
  const [state, dispatch] = useReducer(uploadFlowReducer, createInitialUploadFlowState());

  // Navigation functions
  const navigateToTab = useCallback((tabId: TabId) => {
    dispatch({ type: 'SET_TAB', payload: tabId });
  }, []);

  const goToNextTab = useCallback(() => {
    if (state.currentTab < 3) {
      dispatch({ type: 'SET_TAB', payload: (state.currentTab + 1) as TabId });
    }
  }, [state.currentTab]);

  const goToPreviousTab = useCallback(() => {
    if (state.currentTab > 1) {
      dispatch({ type: 'SET_TAB', payload: (state.currentTab - 1) as TabId });
    }
  }, [state.currentTab]);

  // File management functions
  const setFiles = useCallback((files: File[]) => {
    dispatch({ type: 'SET_FILES', payload: files });
  }, []);

  const addFiles = useCallback((files: File[]) => {
    dispatch({ type: 'ADD_FILES', payload: files });
  }, []);

  const removeFile = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_FILE', payload: index });
  }, []);

  const clearFiles = useCallback(() => {
    dispatch({ type: 'SET_FILES', payload: [] });
  }, []);

  // Processing functions
  const startProcessing = useCallback(() => {
    dispatch({ type: 'START_PROCESSING' });
  }, []);

  const setProcessingProgress = useCallback((progress: number) => {
    dispatch({ type: 'SET_PROCESSING_PROGRESS', payload: progress });
  }, []);

  const completeProcessing = useCallback((result: ExtractionResult) => {
    dispatch({ type: 'COMPLETE_PROCESSING', payload: result });
  }, []);

  // Saving functions
  const startSaving = useCallback(() => {
    dispatch({ type: 'START_SAVING' });
  }, []);

  const completeSaving = useCallback((savedId: string) => {
    dispatch({ type: 'COMPLETE_SAVING', payload: savedId });
  }, []);

  // Error handling
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // Data editing
  const setEditedData = useCallback((data: ExtractionResult) => {
    dispatch({ type: 'SET_EDITED_DATA', payload: data });
  }, []);

  // UI state
  const showProcessingOverlay = useCallback((show: boolean) => {
    dispatch({ type: 'SHOW_PROCESSING_OVERLAY', payload: show });
  }, []);

  const setObjectKey = useCallback((key: string | null) => {
    dispatch({ type: 'SET_OBJECT_KEY', payload: key });
  }, []);

  // Flow control
  const resetFlow = useCallback(() => {
    dispatch({ type: 'RESET_FLOW' });
  }, []);

  // Cleanup effect for preview URLs
  useEffect(() => {
    return () => {
      state.filePreviewUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [state.filePreviewUrls]);

  return {
    // State
    state,
    
    // Navigation
    navigateToTab,
    goToNextTab,
    goToPreviousTab,
    
    // File management
    setFiles,
    addFiles,
    removeFile,
    clearFiles,
    
    // Processing
    startProcessing,
    setProcessingProgress,
    completeProcessing,
    
    // Saving
    startSaving,
    completeSaving,
    
    // Error handling
    setError,
    
    // Data editing
    setEditedData,
    
    // UI state
    showProcessingOverlay,
    setObjectKey,
    
    // Flow control
    resetFlow,
  };
}

// Hook for tab navigation with validation
export function useTabNavigation(state: UploadFlowState) {
  const canNavigateToTab = useCallback((tabId: TabId): boolean => {
    switch (tabId) {
      case 1:
        return true; // Can always go to upload tab
      case 2:
        return state.uploadedFiles.length > 0; // Need files to go to processing/review
      case 3:
        return !!state.savedId; // Need saved report to go to success tab
      default:
        return false;
    }
  }, [state.uploadedFiles.length, state.savedId]);

  const getTabTransition = useCallback((from: TabId, to: TabId): TabTransition => {
    return {
      from,
      to,
      direction: to > from ? 'forward' : 'backward',
    };
  }, []);

  const isTabCompleted = useCallback((tabId: TabId): boolean => {
    switch (tabId) {
      case 1:
        return state.uploadedFiles.length > 0;
      case 2:
        return !!state.savedId;
      case 3:
        return !!state.savedId;
      default:
        return false;
    }
  }, [state.uploadedFiles.length, state.savedId]);

  return {
    canNavigateToTab,
    getTabTransition,
    isTabCompleted,
  };
}