/**
 * Upload Flow State Management - Main Export
 * 
 * This module provides comprehensive state management for the mobile upload flow enhancement.
 * It includes TypeScript interfaces, React hooks, and utility functions for managing
 * the multi-step upload process.
 */

// Core state interfaces and types
export type {
  UploadFlowState,
  ProcessingOverlayState,
  ErrorRecovery,
  TabId,
  TabTransition,
  UploadFlowAction,
  MetricKV,
  ImagingOrgan,
  ExtractionResult,
} from '../upload-flow-state';

// State factory function
export { createInitialUploadFlowState } from '../upload-flow-state';

// React hooks
export { useUploadFlow, useTabNavigation } from '../../hooks/use-upload-flow';

// Utility functions
export {
  validateFiles,
  canTransitionToTab,
  getNextValidTab,
  getPreviousValidTab,
  validateExtractionResult,
  calculateProcessingProgress,
  createErrorRecovery,
  isFlowComplete,
  canProceedFromCurrentTab,
  getTabTitle,
  getTabDescription,
  formatFileSize,
  getFileTypeLabel,
  getProcessingMessage,
  getSuccessMessage,
  FILE_VALIDATION,
} from '../upload-flow-utils';

// Type guards and validation interfaces
export type { FileValidationResult } from '../upload-flow-utils';

// React Components
export { ProgressIndicator, ProgressStep } from '../../components/upload-flow';
export type { ProgressIndicatorProps, ProgressStepProps } from '../../components/upload-flow';

// Example usage (for development and testing)
export {
  simulateUploadFlow,
  simulateErrorHandling,
  simulateTabNavigation,
} from '../upload-flow-example';