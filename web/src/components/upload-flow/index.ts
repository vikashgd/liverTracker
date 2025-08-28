/**
 * Upload Flow Components - Main Export
 */

// Progress Indicator Components
export { ProgressIndicator, ProgressStep } from './progress-indicator';
export type { ProgressIndicatorProps, ProgressStepProps } from './progress-indicator';

// Upload & Preview Tab Components
export { UploadPreviewTab } from './upload-preview-tab';
export type { UploadPreviewTabProps } from './upload-preview-tab';

// Navigation Components
export { BackButton } from './back-button';
export type { BackButtonProps } from './back-button';

export { NextButton } from './next-button';
export type { NextButtonProps } from './next-button';

// Tab System Components
export { UploadFlowTabs } from './upload-flow-tabs';
export type { UploadFlowTabsProps } from './upload-flow-tabs';

// Processing Components
export { ProcessingOverlay } from './processing-overlay';
export type { ProcessingOverlayProps } from './processing-overlay';

export { ProcessingReviewTab } from './processing-review-tab';
export type { ProcessingReviewTabProps } from './processing-review-tab';

export { ReviewForm } from './review-form';
export type { ReviewFormProps } from './review-form';

export { SuccessTab } from './success-tab';
export type { SuccessTabProps } from './success-tab';

// Error Recovery Components
export { ErrorRecoverySystem, useErrorRecovery } from './error-recovery-system';
export type { ErrorRecoveryProps } from './error-recovery-system';

// Accessibility Components
export { 
  AccessibilityAnnouncer, 
  useAccessibilityAnnouncer,
  useKeyboardNavigation,
  useFocusManagement,
  useReducedMotion,
  useHighContrast
} from './accessibility-enhancements';
export type { AccessibilityAnnouncerProps } from './accessibility-enhancements';

// Enhanced Medical Uploader (main integration)
export { EnhancedMedicalUploader, MedicalUploader } from './enhanced-medical-uploader';

// CSS imports for components
import './progress-indicator.css';
import './upload-preview-tab.css';
import './upload-flow-tabs.css';