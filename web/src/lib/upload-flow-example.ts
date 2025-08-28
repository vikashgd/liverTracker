/**
 * Example usage of the upload flow state management
 * This demonstrates how to use the core interfaces and hooks
 */

import { 
  UploadFlowState, 
  ExtractionResult, 
  createInitialUploadFlowState 
} from './upload-flow-state';
import { 
  validateFiles, 
  canTransitionToTab, 
  validateExtractionResult,
  getTabTitle,
  getTabDescription,
  formatFileSize 
} from './upload-flow-utils';

// Example: Complete upload flow simulation
export function simulateUploadFlow() {
  console.log('=== Upload Flow Simulation ===');
  
  // 1. Initialize state
  let state = createInitialUploadFlowState();
  console.log(`Initial state: Tab ${state.currentTab} - ${getTabTitle(state.currentTab)}`);
  
  // 2. Add files
  const mockFiles = [
    new File(['mock content'], 'blood-test.pdf', { type: 'application/pdf' }),
    new File(['mock image'], 'xray.jpg', { type: 'image/jpeg' })
  ];
  
  const fileValidation = validateFiles(mockFiles);
  if (fileValidation.isValid) {
    state = { ...state, uploadedFiles: mockFiles };
    console.log(`Files added: ${mockFiles.length} files (${formatFileSize(mockFiles.reduce((sum, f) => sum + f.size, 0))})`);
  } else {
    console.log('File validation failed:', fileValidation.errors);
    return;
  }
  
  // 3. Navigate to processing tab
  if (canTransitionToTab(state, 2)) {
    state = { ...state, currentTab: 2, isProcessing: true };
    console.log(`Navigated to: Tab ${state.currentTab} - ${getTabTitle(state.currentTab)}`);
  }
  
  // 4. Simulate processing completion
  const mockExtractionResult: ExtractionResult = {
    reportType: 'Blood Test',
    reportDate: '2024-01-15',
    metricsAll: [
      { name: 'Hemoglobin', value: 12.5, unit: 'g/dL' },
      { name: 'White Blood Cells', value: 7200, unit: 'cells/μL' }
    ]
  };
  
  state = {
    ...state,
    isProcessing: false,
    extractedData: mockExtractionResult,
    editedData: mockExtractionResult
  };
  console.log('Processing completed, data extracted');
  
  // 5. Validate extracted data
  const dataValidation = validateExtractionResult(mockExtractionResult);
  if (dataValidation.isValid) {
    console.log('Extracted data is valid');
    if (dataValidation.warnings.length > 0) {
      console.log('Warnings:', dataValidation.warnings);
    }
  } else {
    console.log('Data validation failed:', dataValidation.errors);
  }
  
  // 6. Simulate saving
  state = { ...state, isSaving: true };
  console.log('Saving report...');
  
  // 7. Complete saving and navigate to success
  if (canTransitionToTab(state, 3)) {
    state = {
      ...state,
      isSaving: false,
      savedId: 'report-123',
      currentTab: 3
    };
    console.log(`Report saved! ID: ${state.savedId}`);
    console.log(`Final state: Tab ${state.currentTab} - ${getTabTitle(state.currentTab)}`);
  }
  
  return state;
}

// Example: Error handling simulation
export function simulateErrorHandling() {
  console.log('\n=== Error Handling Simulation ===');
  
  // Test file validation errors
  const invalidFiles = [
    new File(['x'.repeat(15 * 1024 * 1024)], 'too-large.pdf', { type: 'application/pdf' }),
    new File(['content'], 'unsupported.txt', { type: 'text/plain' })
  ];
  
  const validation = validateFiles(invalidFiles);
  console.log('File validation result:', {
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings
  });
  
  // Test data validation errors
  const invalidData: ExtractionResult = {
    reportType: '',
    reportDate: '2024/01/01', // Wrong format
    metricsAll: [
      { name: '', value: 12.5, unit: 'g/dL' }, // Missing name
      { name: 'Glucose', value: null, unit: '' } // Missing value and unit
    ]
  };
  
  const dataValidation = validateExtractionResult(invalidData);
  console.log('Data validation result:', {
    isValid: dataValidation.isValid,
    errors: dataValidation.errors,
    warnings: dataValidation.warnings
  });
}

// Example: Tab navigation validation
export function simulateTabNavigation() {
  console.log('\n=== Tab Navigation Simulation ===');
  
  let state = createInitialUploadFlowState();
  
  // Test navigation rules
  console.log('Navigation validation:');
  console.log(`Can go to Tab 1: ${canTransitionToTab(state, 1)}`);
  console.log(`Can go to Tab 2: ${canTransitionToTab(state, 2)}`);
  console.log(`Can go to Tab 3: ${canTransitionToTab(state, 3)}`);
  
  // Add files and test again
  state.uploadedFiles = [new File(['content'], 'test.jpg', { type: 'image/jpeg' })];
  console.log('\nAfter adding files:');
  console.log(`Can go to Tab 1: ${canTransitionToTab(state, 1)}`);
  console.log(`Can go to Tab 2: ${canTransitionToTab(state, 2)}`);
  console.log(`Can go to Tab 3: ${canTransitionToTab(state, 3)}`);
  
  // Save report and test again
  state.savedId = 'test-id';
  console.log('\nAfter saving report:');
  console.log(`Can go to Tab 1: ${canTransitionToTab(state, 1)}`);
  console.log(`Can go to Tab 2: ${canTransitionToTab(state, 2)}`);
  console.log(`Can go to Tab 3: ${canTransitionToTab(state, 3)}`);
}

// Run all examples if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  simulateUploadFlow();
  simulateErrorHandling();
  simulateTabNavigation();
}