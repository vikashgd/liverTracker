# Upload Flow UX Refinement - Implementation Tasks

## Phase 1: Core Button Changes (High Priority)

### Task 1.1: Replace "Next" Button with "Upload & Extract" in Screen 1
- [ ] 1.1 Update upload-preview-tab.tsx to replace Next button with Upload & Extract
  - Remove "Next" button and related imports
  - Add "Upload & Extract" button with primary styling
  - Implement button state logic (disabled when no files, enabled when files selected)
  - Update button click handler to trigger extraction immediately
  - Add loading state with spinner during processing
  - Update button text during loading: "Extracting..."
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

### Task 1.2: Add Specific Action Buttons to Screen 2
- [ ] 1.2 Update processing-review-tab.tsx to add Re-scan and Save Report buttons
  - Remove any generic navigation buttons
  - Add "Re-scan" button with secondary styling
  - Add "Save Report" button with primary styling
  - Implement "Re-scan" functionality (clear data, return to screen 1)
  - Implement "Save Report" functionality with loading state
  - Position buttons appropriately in the layout
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

### Task 1.3: Remove Generic Navigation Components
- [ ] 1.3 Clean up upload-flow-tabs.tsx navigation logic
  - Remove NextButton and BackButton imports
  - Remove handleNext and generic navigation functions
  - Remove getNextButtonText and isNextLoading functions
  - Update component to use specific action handlers
  - Clean up unused navigation state and logic
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

## Phase 2: Enhanced Processing Overlay (High Priority)

### Task 2.1: Enhance Full-Screen Processing Overlay
- [ ] 2.1 Update processing-overlay.tsx for full-screen experience
  - Implement true full-screen coverage (z-index: 9999)
  - Add dynamic text updates based on processing stage
  - Enhance loading animation with better visual design
  - Ensure overlay cannot be dismissed during processing
  - Add accessibility attributes (role, aria-modal, aria-labelledby)
  - Implement responsive design for mobile devices
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

### Task 2.2: Implement Dynamic Processing Messages
- [ ] 2.2 Add dynamic content to processing overlay
  - Create processing stage enum (uploading, extracting, analyzing, completing)
  - Implement message mapping for each stage
  - Add progress indication if available from backend
  - Update overlay text dynamically during processing
  - Add smooth transitions between message updates
  - _Requirements: 2.2, 2.3_

### Task 2.3: Integrate Enhanced Overlay with Upload Flow
- [ ] 2.3 Connect enhanced overlay to upload flow logic
  - Show overlay when "Upload & Extract" is clicked
  - Update overlay stage and messages during processing
  - Hide overlay when processing completes successfully
  - Handle processing errors within overlay
  - Ensure proper cleanup and state management
  - _Requirements: 2.1, 2.5_

## Phase 3: Flow Logic Updates (Medium Priority)

### Task 3.1: Update Upload Flow State Management
- [ ] 3.1 Enhance upload-flow-state.ts for specific actions
  - Add extraction stage tracking (uploading, extracting, analyzing, completing)
  - Add button-specific loading states (isExtracting, isSaving)
  - Remove generic navigation state properties
  - Add error handling for specific action types
  - Update state interface to match new flow requirements
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

### Task 3.2: Implement Specific Action Handlers
- [ ] 3.2 Create action handlers for each button in enhanced-medical-uploader.tsx
  - Implement handleUploadAndExtract function
  - Implement handleRescan function (clear data, reset to screen 1)
  - Implement handleSaveReport function with loading state
  - Add error handling for each action type
  - Update component to pass specific handlers to child components
  - _Requirements: 1.4, 3.3, 3.4_

### Task 3.3: Update Tab Navigation Logic
- [ ] 3.3 Modify use-tab-navigation.ts hook for action-based flow
  - Remove generic next/back navigation functions
  - Add specific navigation functions (goToUpload, goToReview, goToSuccess)
  - Update navigation validation logic
  - Ensure proper state transitions for each action
  - Add navigation restrictions based on current state
  - _Requirements: 5.5_

## Phase 4: Button Styling and States (Medium Priority)

### Task 4.1: Implement Enhanced Button Styling
- [ ] 4.1 Create button styles for specific actions
  - Add primary action button styles (Upload & Extract, Save Report)
  - Add secondary action button styles (Re-scan)
  - Implement loading state styles with spinners
  - Add disabled state styles
  - Ensure mobile-friendly touch targets (min 56px height)
  - Add hover and focus states for accessibility
  - _Requirements: 6.1, 6.2, 6.3_

### Task 4.2: Add Button Loading Components
- [ ] 4.2 Create reusable loading button components
  - Create LoadingSpinner component for buttons
  - Create ActionButton component with loading states
  - Implement button text switching during loading
  - Add accessibility attributes for loading states
  - Ensure proper keyboard navigation during loading
  - _Requirements: 6.1, 6.2, 6.5_

### Task 4.3: Update Button Accessibility
- [ ] 4.3 Enhance button accessibility attributes
  - Add descriptive aria-labels for each button
  - Add aria-describedby for help text
  - Implement screen reader announcements for state changes
  - Add keyboard navigation support
  - Ensure proper focus management
  - _Requirements: 6.5_

## Phase 5: Error Handling and Edge Cases (Medium Priority)

### Task 5.1: Implement Action-Specific Error Handling
- [ ] 5.1 Add error handling for Upload & Extract action
  - Handle file upload errors with clear messaging
  - Handle extraction service errors with retry options
  - Handle network connectivity issues
  - Provide clear recovery actions for users
  - Preserve uploaded files during error recovery
  - _Requirements: Error handling requirements_

### Task 5.2: Add Confirmation Dialogs
- [ ] 5.2 Implement confirmation for destructive actions
  - Add confirmation dialog for "Re-scan" action
  - Warn users about data loss when re-scanning
  - Provide clear options (Continue, Cancel)
  - Ensure accessibility compliance for dialogs
  - Add keyboard navigation for dialog actions
  - _Requirements: 3.3_

### Task 5.3: Handle Edge Cases
- [ ] 5.3 Address edge cases and validation
  - Validate file types and sizes before processing
  - Handle empty extraction results gracefully
  - Handle partial extraction results
  - Implement proper cleanup on navigation away
  - Add timeout handling for long-running processes
  - _Requirements: Various edge case requirements_

## Phase 6: Testing and Validation (High Priority)

### Task 6.1: Update Component Tests
- [ ] 6.1 Update existing tests for new button behavior
  - Update upload-preview-tab.test.tsx for Upload & Extract button
  - Update processing-review-tab.test.tsx for specific action buttons
  - Update upload-flow-tabs.test.tsx for removed navigation logic
  - Add tests for button states (disabled, enabled, loading)
  - Add tests for accessibility attributes
  - _Requirements: All requirements validation_

### Task 6.2: Add Integration Tests
- [ ] 6.2 Create integration tests for complete flow
  - Test upload → extract → review → save flow
  - Test re-scan functionality and data clearing
  - Test error scenarios and recovery paths
  - Test loading states and transitions
  - Validate no generic "Next" buttons exist anywhere
  - _Requirements: All requirements validation_

### Task 6.3: Add Accessibility Tests
- [ ] 6.3 Implement accessibility testing
  - Test keyboard navigation through entire flow
  - Test screen reader compatibility
  - Verify ARIA labels and roles
  - Test color contrast ratios
  - Test with reduced motion preferences
  - _Requirements: 6.5_

## Phase 7: Mobile Optimization and Polish (Low Priority)

### Task 7.1: Mobile Responsiveness Testing
- [ ] 7.1 Test and optimize mobile experience
  - Test on various mobile devices and screen sizes
  - Verify touch targets are appropriate size (min 56px)
  - Test landscape and portrait orientations
  - Verify overlay behavior on mobile
  - Test swipe navigation if implemented
  - _Requirements: Mobile responsiveness_

### Task 7.2: Performance Optimization
- [ ] 7.2 Optimize performance for mobile devices
  - Optimize loading animations for smooth performance
  - Minimize re-renders during state changes
  - Optimize image processing for mobile
  - Add loading indicators for slow connections
  - Test performance on low-end devices
  - _Requirements: Performance requirements_

### Task 7.3: Final Polish and UX Testing
- [ ] 7.3 Final user experience validation
  - Conduct user testing with new button flow
  - Verify button purposes are immediately clear
  - Test complete flow without user confusion
  - Validate loading states provide clear feedback
  - Ensure error messages are helpful and actionable
  - _Requirements: All UX requirements_

## Implementation Order and Dependencies

### Week 1: Core Functionality
- Task 1.1: Replace Next button with Upload & Extract
- Task 1.2: Add Re-scan and Save Report buttons
- Task 2.1: Enhance processing overlay

### Week 2: Integration and Logic
- Task 1.3: Remove generic navigation
- Task 3.1: Update state management
- Task 3.2: Implement action handlers

### Week 3: Styling and Enhancement
- Task 2.2: Dynamic processing messages
- Task 4.1: Enhanced button styling
- Task 4.2: Loading components

### Week 4: Testing and Polish
- Task 6.1: Update component tests
- Task 6.2: Integration tests
- Task 7.3: Final UX validation

## Success Criteria Validation

### Functional Validation
- [ ] Screen 1 shows only "Upload & Extract" button (no "Next")
- [ ] Screen 2 shows only "Re-scan" and "Save Report" buttons
- [ ] Processing shows full-screen overlay with dynamic text
- [ ] All buttons have clear, specific purposes
- [ ] Loading states work correctly for all actions
- [ ] No generic navigation buttons exist anywhere

### User Experience Validation
- [ ] Users immediately understand button purposes
- [ ] No confusion about navigation or next steps
- [ ] Clear visual feedback during processing
- [ ] Smooth transitions between screens
- [ ] Mobile-friendly interactions

### Technical Validation
- [ ] All TypeScript errors resolved
- [ ] Tests pass for all components
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Performance acceptable on mobile
- [ ] Error handling comprehensive and user-friendly

## Risk Mitigation

### High Risk Items
1. **Breaking existing functionality**: Ensure thorough testing of all flow paths
2. **User confusion during transition**: Implement changes incrementally with user feedback
3. **Mobile performance**: Test early and optimize loading states

### Mitigation Strategies
- Implement feature flags for gradual rollout
- Maintain backward compatibility during development
- Get user feedback on button clarity early
- Test on real mobile devices throughout development
- Have rollback plan ready if issues arise

## Files to be Modified

### Primary Files
- `web/src/components/upload-flow/upload-preview-tab.tsx` - Replace Next with Upload & Extract
- `web/src/components/upload-flow/processing-review-tab.tsx` - Add specific action buttons
- `web/src/components/upload-flow/processing-overlay.tsx` - Enhance full-screen overlay
- `web/src/components/upload-flow/upload-flow-tabs.tsx` - Remove generic navigation
- `web/src/lib/upload-flow-state.ts` - Update state management

### Secondary Files
- `web/src/components/upload-flow/enhanced-medical-uploader.tsx` - Action handlers
- `web/src/hooks/use-tab-navigation.ts` - Update navigation logic
- `web/src/components/upload-flow/next-button.tsx` - Remove or deprecate
- `web/src/components/upload-flow/back-button.tsx` - Remove or deprecate

### Test Files
- All `__tests__/*.test.tsx` files in upload-flow directory
- Integration test files
- Accessibility test files