# Upload Flow State Management

This module provides comprehensive state management for the mobile upload flow enhancement. It implements a multi-step upload process with clear state transitions, validation, and error handling.

## Overview

The upload flow consists of three main tabs:
1. **Upload & Preview** - File selection and preview
2. **Review & Save** - AI processing and data review
3. **Success** - Confirmation and flow reset

## Core Components

### State Interface

```typescript
interface UploadFlowState {
  currentTab: 1 | 2 | 3;
  uploadedFiles: File[];
  filePreviewUrls: string[];
  isProcessing: boolean;
  processingProgress: number;
  extractedData: ExtractionResult;
  editedData: ExtractionResult;
  isSaving: boolean;
  savedId: string | null;
  error: string | null;
  showProcessingOverlay: boolean;
  autoAdvanceEnabled: boolean;
  objectKey: string | null;
}
```

### Main Hook

```typescript
const {
  state,
  navigateToTab,
  goToNextTab,
  goToPreviousTab,
  setFiles,
  addFiles,
  removeFile,
  clearFiles,
  startProcessing,
  completeProcessing,
  startSaving,
  completeSaving,
  setError,
  setEditedData,
  resetFlow,
} = useUploadFlow();
```

## Usage Examples

### Basic Setup

```typescript
import { useUploadFlow } from '@/lib/upload-flow';

function MedicalUploader() {
  const {
    state,
    setFiles,
    goToNextTab,
    startProcessing,
    completeProcessing,
  } = useUploadFlow();

  const handleFileSelection = (files: FileList) => {
    setFiles(Array.from(files));
  };

  const handleProcessing = async () => {
    startProcessing();
    try {
      // AI processing logic here
      const result = await processFiles(state.uploadedFiles);
      completeProcessing(result);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      {state.currentTab === 1 && (
        <UploadTab 
          files={state.uploadedFiles}
          onFilesChange={handleFileSelection}
          onNext={goToNextTab}
        />
      )}
      {state.currentTab === 2 && (
        <ProcessingTab
          isProcessing={state.isProcessing}
          extractedData={state.extractedData}
          onProcess={handleProcessing}
        />
      )}
      {state.currentTab === 3 && (
        <SuccessTab savedId={state.savedId} />
      )}
    </div>
  );
}
```

### File Validation

```typescript
import { validateFiles, FILE_VALIDATION } from '@/lib/upload-flow';

const handleFileSelection = (files: File[]) => {
  const validation = validateFiles(files);
  
  if (!validation.isValid) {
    setError(validation.errors.join(', '));
    return;
  }
  
  if (validation.warnings.length > 0) {
    console.warn('File warnings:', validation.warnings);
  }
  
  setFiles(files);
};
```

### Tab Navigation with Validation

```typescript
import { useTabNavigation } from '@/lib/upload-flow';

const { canNavigateToTab, isTabCompleted } = useTabNavigation(state);

const handleTabClick = (tabId: TabId) => {
  if (canNavigateToTab(tabId)) {
    navigateToTab(tabId);
  } else {
    setError(`Cannot navigate to ${getTabTitle(tabId)}`);
  }
};
```

### Data Validation

```typescript
import { validateExtractionResult } from '@/lib/upload-flow';

const handleSave = () => {
  const validation = validateExtractionResult(state.editedData);
  
  if (!validation.isValid) {
    setError(validation.errors.join(', '));
    return;
  }
  
  startSaving();
  // Save logic here
};
```

## State Transitions

The state management follows these rules:

1. **Tab 1 → Tab 2**: Requires at least one file
2. **Tab 2 → Tab 3**: Requires successful save
3. **Any Tab → Tab 1**: Always allowed (with confirmation)
4. **Auto-advance**: Enabled by default for smooth UX

## Error Handling

```typescript
import { createErrorRecovery } from '@/lib/upload-flow';

const handleError = (error: string, context: 'file_validation' | 'processing' | 'save') => {
  const recovery = createErrorRecovery(
    error,
    context,
    () => retryOperation(),
    () => goToPreviousTab()
  );
  
  setError(recovery.message);
  // Show recovery options to user
};
```

## File Size and Type Validation

```typescript
// Supported file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/heic',
  'image/heif',
  'application/pdf'
];

// Size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;
```

## Progress Tracking

```typescript
import { calculateProcessingProgress } from '@/lib/upload-flow';

const updateProgress = (step: 'uploading' | 'extracting' | 'complete', processed: number) => {
  const progress = calculateProcessingProgress(step, state.uploadedFiles.length, processed);
  setProcessingProgress(progress);
};
```

## Testing

The module includes comprehensive tests for:
- State management and transitions
- File validation
- Tab navigation rules
- Data validation
- Error handling
- Hook behavior

Run tests with:
```bash
npm run test:run -- src/lib/__tests__/upload-flow-state.test.ts
npm run test:run -- src/hooks/__tests__/use-upload-flow.test.ts
```

## Requirements Satisfied

This implementation satisfies the following requirements:

- **1.1-1.5**: Multi-step flow with progress indication and smooth transitions
- **2.1-2.5**: File preview and management functionality
- **3.1-3.6**: AI processing state management
- **4.1-4.5**: Data review and editing capabilities
- **5.1-5.5**: Success confirmation and flow reset
- **6.1-6.5**: Navigation controls and mobile optimization
- **7.1-7.5**: Mobile-specific enhancements and responsive design

## Integration

To integrate with the existing MedicalUploader component:

1. Import the upload flow hooks
2. Replace existing state management with `useUploadFlow`
3. Implement tab-based UI structure
4. Add validation and error handling
5. Maintain backward compatibility with existing APIs

The state management is designed to be a drop-in replacement for the current uploader state while adding the new multi-step functionality.