/**
 * Utility functions for upload flow state transitions and validation
 * Provides helper functions for flow control and data validation
 */

import { UploadFlowState, TabId, ExtractionResult, ErrorRecovery } from '@/lib/upload-flow-state';

// File validation utilities
export const FILE_VALIDATION = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/heic',
    'image/heif',
    'application/pdf'
  ],
  MAX_FILES: 10,
} as const;

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateFiles(files: File[]): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (files.length === 0) {
    errors.push('Please select at least one file');
    return { isValid: false, errors, warnings };
  }

  if (files.length > FILE_VALIDATION.MAX_FILES) {
    errors.push(`Maximum ${FILE_VALIDATION.MAX_FILES} files allowed`);
  }

  files.forEach((file, index) => {
    // Check file size
    if (file.size > FILE_VALIDATION.MAX_FILE_SIZE) {
      errors.push(`File ${index + 1} (${file.name}) is too large. Maximum size is 10MB`);
    }

    // Check file type
    if (!FILE_VALIDATION.ALLOWED_TYPES.includes(file.type as any)) {
      errors.push(`File ${index + 1} (${file.name}) has unsupported format. Allowed: JPG, PNG, HEIC, PDF`);
    }

    // Warnings for large files
    if (file.size > 5 * 1024 * 1024) {
      warnings.push(`File ${index + 1} (${file.name}) is large and may take longer to process`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// State transition validation
export function canTransitionToTab(currentState: UploadFlowState, targetTab: TabId): boolean {
  switch (targetTab) {
    case 1:
      // Can always return to upload tab
      return true;
      
    case 2:
      // Can go to processing/review if files are selected
      return currentState.uploadedFiles.length > 0;
      
    case 3:
      // Can go to success tab only if report is saved
      return !!currentState.savedId;
      
    default:
      return false;
  }
}

export function getNextValidTab(currentState: UploadFlowState): TabId | null {
  const currentTab = currentState.currentTab;
  
  for (let tab = (currentTab + 1) as TabId; tab <= 3; tab++) {
    if (canTransitionToTab(currentState, tab)) {
      return tab;
    }
  }
  
  return null;
}

export function getPreviousValidTab(currentState: UploadFlowState): TabId | null {
  const currentTab = currentState.currentTab;
  
  for (let tab = (currentTab - 1) as TabId; tab >= 1; tab--) {
    if (canTransitionToTab(currentState, tab)) {
      return tab;
    }
  }
  
  return null;
}

// Data validation utilities
export function validateExtractionResult(data: ExtractionResult): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data) {
    errors.push('No extracted data available');
    return { isValid: false, errors, warnings };
  }

  // Validate report date
  if (!data.reportDate || data.reportDate.trim() === '') {
    errors.push('Report date is required');
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.reportDate)) {
      errors.push('Report date must be in YYYY-MM-DD format');
    }
  }

  // Validate report type
  if (!data.reportType || data.reportType.trim() === '') {
    warnings.push('Report type is recommended for better organization');
  }

  // Validate metrics
  if (data.metricsAll && data.metricsAll.length > 0) {
    data.metricsAll.forEach((metric, index) => {
      if (!metric.name || metric.name.trim() === '') {
        errors.push(`Metric ${index + 1}: Name is required`);
      }
      
      if (metric.value === null || metric.value === undefined) {
        warnings.push(`Metric ${index + 1} (${metric.name}): Value is missing`);
      }
      
      if (!metric.unit || metric.unit.trim() === '') {
        warnings.push(`Metric ${index + 1} (${metric.name}): Unit is recommended`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Progress calculation utilities
export function calculateProcessingProgress(
  currentStep: 'uploading' | 'extracting' | 'complete',
  fileCount: number,
  processedFiles: number = 0
): number {
  switch (currentStep) {
    case 'uploading':
      return Math.min(30, (processedFiles / fileCount) * 30);
    case 'extracting':
      return 30 + Math.min(60, (processedFiles / fileCount) * 60);
    case 'complete':
      return 100;
    default:
      return 0;
  }
}

// Error recovery utilities
export function createErrorRecovery(
  error: string,
  context: 'file_validation' | 'processing' | 'save',
  retryFn?: () => void,
  goBackFn?: () => void
): ErrorRecovery {
  const actions: ErrorRecovery['actions'] = {};
  
  if (retryFn) {
    actions.retry = retryFn;
  }
  
  if (goBackFn) {
    actions.goBack = goBackFn;
  }

  return {
    type: context,
    message: error,
    actions,
  };
}

// Flow state utilities
export function isFlowComplete(state: UploadFlowState): boolean {
  return !!state.savedId && state.currentTab === 3;
}

export function canProceedFromCurrentTab(state: UploadFlowState): boolean {
  switch (state.currentTab) {
    case 1:
      return state.uploadedFiles.length > 0 && !state.isProcessing;
    case 2:
      return !!state.editedData && !state.isSaving;
    case 3:
      return true; // Can always reset from success tab
    default:
      return false;
  }
}

export function getTabTitle(tabId: TabId): string {
  switch (tabId) {
    case 1:
      return '';
    case 2:
      return '';
    case 3:
      return '';
    default:
      return '';
  }
}

export function getTabDescription(tabId: TabId): string {
  switch (tabId) {
    case 1:
      return 'Select and preview your medical files';
    case 2:
      return 'Review extracted data and save your report';
    case 3:
      return 'Your report has been saved successfully';
    default:
      return '';
  }
}

// File size formatting utility
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// File type detection utility
export function getFileTypeLabel(file: File): string {
  if (file.type.includes('pdf')) return 'PDF';
  if (file.type.includes('image')) return 'IMG';
  return 'FILE';
}

// Processing message utilities
export function getProcessingMessage(fileCount: number, currentStep: string): string {
  const baseMessage = 'Processing with AI Vision - Our AI is detecting professional medical data';
  
  if (fileCount === 1) {
    return baseMessage;
  }
  
  return `${baseMessage} (${fileCount} files)`;
}

export function getSuccessMessage(reportType?: string | null): string {
  const baseMessage = 'Report saved successfully!';
  
  if (reportType) {
    return `${reportType} ${baseMessage.toLowerCase()}`;
  }
  
  return baseMessage;
}