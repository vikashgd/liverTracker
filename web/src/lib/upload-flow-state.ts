/**
 * Core state management for mobile upload flow enhancement
 * Defines interfaces and types for the multi-step upload process
 */

// Re-export existing types from medical uploader for compatibility
export type MetricKV = { value: number | null; unit: string | null };
export type ImagingOrgan = { 
  name: string; 
  size?: { value: number | null; unit: string | null } | null; 
  notes?: string | null 
};

export type ExtractionResult = {
  reportType?: string | null;
  reportDate?: string | null;
  metrics?: Record<string, MetricKV | null>;
  metricsAll?: { 
    name: string; 
    value: number | null; 
    unit: string | null; 
    category?: string | null 
  }[] | null;
  imaging?: {
    modality?: string | null;
    organs?: ImagingOrgan[] | null;
    findings?: string[] | null;
  } | null;
} | null;

// Core flow state interface
export interface UploadFlowState {
  // Navigation state
  currentTab: 1 | 2 | 3;
  
  // File management
  uploadedFiles: File[];
  filePreviewUrls: string[];
  
  // AI Processing state
  isProcessing: boolean;
  processingProgress: number;
  
  // Data review state
  extractedData: ExtractionResult;
  editedData: ExtractionResult;
  
  // Saving state
  isSaving: boolean;
  savedId: string | null;
  
  // Error handling
  error: string | null;
  
  // UI state
  showProcessingOverlay: boolean;
  autoAdvanceEnabled: boolean;
  
  // Storage
  objectKey: string | null;
}

// Processing overlay state
export interface ProcessingOverlayState {
  isVisible: boolean;
  message: string;
  progress: number;
  canCancel: boolean;
}

// Error recovery interface
export interface ErrorRecovery {
  type: 'file_validation' | 'processing' | 'save';
  message: string;
  actions: {
    retry?: () => void;
    goBack?: () => void;
    skip?: () => void;
  };
}

// Tab navigation types
export type TabId = 1 | 2 | 3;

export interface TabTransition {
  from: TabId;
  to: TabId;
  direction: 'forward' | 'backward';
}

// State action types for reducer pattern
export type UploadFlowAction =
  | { type: 'SET_TAB'; payload: TabId }
  | { type: 'SET_FILES'; payload: File[] }
  | { type: 'ADD_FILES'; payload: File[] }
  | { type: 'REMOVE_FILE'; payload: number }
  | { type: 'START_PROCESSING' }
  | { type: 'SET_PROCESSING_PROGRESS'; payload: number }
  | { type: 'COMPLETE_PROCESSING'; payload: ExtractionResult }
  | { type: 'START_SAVING' }
  | { type: 'COMPLETE_SAVING'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EDITED_DATA'; payload: ExtractionResult }
  | { type: 'RESET_FLOW' }
  | { type: 'SHOW_PROCESSING_OVERLAY'; payload: boolean }
  | { type: 'SET_OBJECT_KEY'; payload: string | null };

// Initial state factory
export function createInitialUploadFlowState(): UploadFlowState {
  return {
    currentTab: 1,
    uploadedFiles: [],
    filePreviewUrls: [],
    isProcessing: false,
    processingProgress: 0,
    extractedData: null,
    editedData: null,
    isSaving: false,
    savedId: null,
    error: null,
    showProcessingOverlay: false,
    autoAdvanceEnabled: true,
    objectKey: null,
  };
}