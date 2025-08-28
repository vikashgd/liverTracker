/**
 * Tests for upload flow state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createInitialUploadFlowState, 
  UploadFlowState, 
  ExtractionResult 
} from '../upload-flow-state';
import { 
  validateFiles, 
  canTransitionToTab, 
  validateExtractionResult,
  calculateProcessingProgress,
  FILE_VALIDATION 
} from '../upload-flow-utils';

describe('Upload Flow State', () => {
  let initialState: UploadFlowState;

  beforeEach(() => {
    initialState = createInitialUploadFlowState();
  });

  it('should create initial state correctly', () => {
    expect(initialState.currentTab).toBe(1);
    expect(initialState.uploadedFiles).toEqual([]);
    expect(initialState.isProcessing).toBe(false);
    expect(initialState.isSaving).toBe(false);
    expect(initialState.savedId).toBeNull();
    expect(initialState.error).toBeNull();
  });

  it('should have correct default values', () => {
    expect(initialState.filePreviewUrls).toEqual([]);
    expect(initialState.processingProgress).toBe(0);
    expect(initialState.extractedData).toBeNull();
    expect(initialState.editedData).toBeNull();
    expect(initialState.showProcessingOverlay).toBe(false);
    expect(initialState.autoAdvanceEnabled).toBe(true);
    expect(initialState.objectKey).toBeNull();
  });
});

describe('File Validation', () => {
  it('should validate empty file list', () => {
    const result = validateFiles([]);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Please select at least one file');
  });

  it('should validate file size limits', () => {
    const largeFile = new File(['x'.repeat(FILE_VALIDATION.MAX_FILE_SIZE + 1)], 'large.jpg', {
      type: 'image/jpeg'
    });
    
    const result = validateFiles([largeFile]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('too large'))).toBe(true);
  });

  it('should validate file types', () => {
    const invalidFile = new File(['content'], 'test.txt', {
      type: 'text/plain'
    });
    
    const result = validateFiles([invalidFile]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('unsupported format'))).toBe(true);
  });

  it('should validate valid files', () => {
    const validFile = new File(['content'], 'test.jpg', {
      type: 'image/jpeg'
    });
    
    const result = validateFiles([validFile]);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should warn about large files', () => {
    const largeButValidFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg'
    });
    
    const result = validateFiles([largeButValidFile]);
    expect(result.isValid).toBe(true);
    expect(result.warnings.some(warning => warning.includes('large and may take longer'))).toBe(true);
  });

  it('should validate maximum file count', () => {
    const files = Array.from({ length: FILE_VALIDATION.MAX_FILES + 1 }, (_, i) => 
      new File(['content'], `test${i}.jpg`, { type: 'image/jpeg' })
    );
    
    const result = validateFiles(files);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('Maximum'))).toBe(true);
  });
});

describe('Tab Navigation', () => {
  it('should allow navigation to tab 1 from any state', () => {
    const state = createInitialUploadFlowState();
    expect(canTransitionToTab(state, 1)).toBe(true);
    
    state.currentTab = 2;
    expect(canTransitionToTab(state, 1)).toBe(true);
    
    state.currentTab = 3;
    expect(canTransitionToTab(state, 1)).toBe(true);
  });

  it('should require files for tab 2 navigation', () => {
    const state = createInitialUploadFlowState();
    expect(canTransitionToTab(state, 2)).toBe(false);
    
    state.uploadedFiles = [new File(['content'], 'test.jpg', { type: 'image/jpeg' })];
    expect(canTransitionToTab(state, 2)).toBe(true);
  });

  it('should require saved report for tab 3 navigation', () => {
    const state = createInitialUploadFlowState();
    expect(canTransitionToTab(state, 3)).toBe(false);
    
    state.savedId = 'test-id';
    expect(canTransitionToTab(state, 3)).toBe(true);
  });
});

describe('Extraction Result Validation', () => {
  it('should validate null extraction result', () => {
    const result = validateExtractionResult(null);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('No extracted data available');
  });

  it('should require report date', () => {
    const extractionResult: ExtractionResult = {
      reportType: 'Blood Test',
      reportDate: '',
      metricsAll: []
    };
    
    const result = validateExtractionResult(extractionResult);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Report date is required');
  });

  it('should validate date format', () => {
    const extractionResult: ExtractionResult = {
      reportType: 'Blood Test',
      reportDate: '2024/01/01',
      metricsAll: []
    };
    
    const result = validateExtractionResult(extractionResult);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Report date must be in YYYY-MM-DD format');
  });

  it('should validate valid extraction result', () => {
    const extractionResult: ExtractionResult = {
      reportType: 'Blood Test',
      reportDate: '2024-01-01',
      metricsAll: [
        { name: 'Hemoglobin', value: 12.5, unit: 'g/dL' }
      ]
    };
    
    const result = validateExtractionResult(extractionResult);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should warn about missing report type', () => {
    const extractionResult: ExtractionResult = {
      reportDate: '2024-01-01',
      metricsAll: []
    };
    
    const result = validateExtractionResult(extractionResult);
    expect(result.isValid).toBe(true);
    expect(result.warnings.some(warning => warning.includes('Report type is recommended'))).toBe(true);
  });

  it('should validate metrics', () => {
    const extractionResult: ExtractionResult = {
      reportType: 'Blood Test',
      reportDate: '2024-01-01',
      metricsAll: [
        { name: '', value: 12.5, unit: 'g/dL' },
        { name: 'Glucose', value: null, unit: 'mg/dL' },
        { name: 'Cholesterol', value: 200, unit: '' }
      ]
    };
    
    const result = validateExtractionResult(extractionResult);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(error => error.includes('Name is required'))).toBe(true);
    expect(result.warnings.some(warning => warning.includes('Value is missing'))).toBe(true);
    expect(result.warnings.some(warning => warning.includes('Unit is recommended'))).toBe(true);
  });
});

describe('Processing Progress', () => {
  it('should calculate uploading progress', () => {
    const progress = calculateProcessingProgress('uploading', 3, 1);
    expect(progress).toBe(10); // 1/3 * 30 = 10
  });

  it('should calculate extracting progress', () => {
    const progress = calculateProcessingProgress('extracting', 2, 1);
    expect(progress).toBe(60); // 30 + (1/2 * 60) = 60
  });

  it('should return 100 for complete', () => {
    const progress = calculateProcessingProgress('complete', 5, 5);
    expect(progress).toBe(100);
  });

  it('should cap progress at step limits', () => {
    const uploadProgress = calculateProcessingProgress('uploading', 1, 2);
    expect(uploadProgress).toBe(30); // Capped at 30

    const extractProgress = calculateProcessingProgress('extracting', 1, 2);
    expect(extractProgress).toBe(90); // 30 + 60 = 90
  });
});