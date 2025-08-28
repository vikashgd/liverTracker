# Upload Flow UX Refinement Requirements

## Introduction

This feature refines the existing three-screen upload flow to provide clear, intuitive user experience with proper button functionality and loading states. The main issues are confusing button labels, missing loading states during extraction, and unclear navigation between screens.

## Current Issues to Fix

- Screen 1 has confusing "Next" button instead of action-oriented "Upload & Extract"
- Missing full-screen loading overlay during extraction process
- Screen 2 has generic navigation buttons instead of specific "Re-scan" and "Save Report" actions
- No dynamic content during processing (loading animation, progress text)
- Users don't understand what each button does

## Three-Screen Flow Definition

### Screen 1: Upload & Extract
- **Purpose:** File selection and immediate extraction
- **Single Button:** "Upload & Extract" (NOT "Next")
- **Behavior:** Immediately starts extraction when clicked
- **Loading State:** Full-screen overlay with dynamic text and loading animation

### Screen 2: Review & Confirm  
- **Purpose:** Display extracted data for user review
- **Two Buttons:** "Re-scan" (back to Screen 1) and "Save Report" (proceed to Screen 3)
- **Content:** Show all extracted medical parameters
- **Loading State:** Button-level loading during save operation

### Screen 3: Success & Actions
- **Purpose:** Confirm successful save and provide next actions
- **Content:** Success message, report summary
- **Actions:** Multiple options for next steps

## Requirements

### Requirement 1: Single Action Button on Screen 1

**User Story:** As a user, I want one clear button that uploads and extracts my files, so that I don't have to perform multiple confusing steps.

#### Acceptance Criteria

1. WHEN the user is on Screen 1 THEN the system SHALL display only one button labeled "Upload & Extract"
2. WHEN no files are selected THEN the system SHALL disable the "Upload & Extract" button
3. WHEN files are selected THEN the system SHALL enable the "Upload & Extract" button
4. WHEN the user clicks "Upload & Extract" THEN the system SHALL immediately start the extraction process
5. WHEN extraction starts THEN the system SHALL show a full-screen processing overlay

### Requirement 2: Full-Screen Processing Overlay

**User Story:** As a user, I want clear visual feedback during extraction, so that I know the system is working and what it's doing.

#### Acceptance Criteria

1. WHEN extraction begins THEN the system SHALL display a full-screen overlay covering the entire interface
2. WHEN the overlay is shown THEN the system SHALL display dynamic text "Extracting parameters from your uploaded report..."
3. WHEN processing is active THEN the system SHALL show a loading animation/spinner
4. WHEN the overlay is displayed THEN the user SHALL NOT be able to dismiss it or navigate away
5. WHEN extraction completes THEN the system SHALL automatically hide the overlay and proceed to Screen 2

### Requirement 3: Review Screen with Specific Actions

**User Story:** As a user, I want to review extracted data and have clear options to either re-scan or save, so that I can verify accuracy before proceeding.

#### Acceptance Criteria

1. WHEN Screen 2 loads THEN the system SHALL display all extracted medical parameters in a readable format
2. WHEN on Screen 2 THEN the system SHALL show exactly two buttons: "Re-scan" and "Save Report"
3. WHEN the user clicks "Re-scan" THEN the system SHALL return to Screen 1 and clear all current data
4. WHEN the user clicks "Save Report" THEN the system SHALL save the data to the database
5. WHEN saving is in progress THEN the system SHALL show loading state on the "Save Report" button

### Requirement 4: Success Confirmation Screen

**User Story:** As a user, I want clear confirmation that my report was saved successfully, so that I know the process completed and can decide what to do next.

#### Acceptance Criteria

1. WHEN data is saved successfully THEN the system SHALL display Screen 3 with a success message
2. WHEN on Screen 3 THEN the system SHALL show a summary of the saved report
3. WHEN on Screen 3 THEN the system SHALL provide multiple action options (View Report, Upload Another, Go to Dashboard)
4. WHEN the user selects an action THEN the system SHALL navigate to the appropriate destination
5. WHEN the user chooses "Upload Another" THEN the system SHALL reset the flow and return to Screen 1

### Requirement 5: Remove Unnecessary Navigation Elements

**User Story:** As a user, I want a clean interface without confusing buttons, so that I can focus on the main actions without distraction.

#### Acceptance Criteria

1. WHEN on any screen THEN the system SHALL NOT display generic "Next" or "Back" buttons
2. WHEN on Screen 1 THEN the system SHALL only show the "Upload & Extract" button
3. WHEN on Screen 2 THEN the system SHALL only show "Re-scan" and "Save Report" buttons
4. WHEN on Screen 3 THEN the system SHALL only show specific action buttons
5. WHEN navigation is needed THEN the system SHALL use specific, purpose-driven button labels

### Requirement 6: Loading States and Visual Feedback

**User Story:** As a user, I want to see clear loading states for all actions, so that I know when the system is processing and what to expect.

#### Acceptance Criteria

1. WHEN any button is clicked THEN the system SHALL show appropriate loading state
2. WHEN "Upload & Extract" is processing THEN the system SHALL show full-screen overlay with spinner
3. WHEN "Save Report" is processing THEN the system SHALL show button-level loading with spinner
4. WHEN loading is active THEN the system SHALL disable other interactive elements
5. WHEN processing completes THEN the system SHALL provide clear success feedback

## Technical Requirements

### Button States
- **Upload & Extract:** Disabled (no files) → Enabled (files selected) → Loading (processing)
- **Save Report:** Enabled (data available) → Loading (saving) → Success (briefly)
- **Re-scan:** Always enabled when on Screen 2

### Processing Overlay
- Full-screen modal that cannot be dismissed
- Dynamic status text
- Loading animation/spinner
- Proper z-index and accessibility attributes

### Navigation Rules
- Screen 1 → Screen 2: Only after successful extraction
- Screen 2 → Screen 1: Via "Re-scan" button (clears data)
- Screen 2 → Screen 3: Only after successful save
- Screen 3: Can navigate to various destinations based on user choice

## Success Metrics

- Users complete the flow without confusion about button purposes
- Clear understanding of current step and next actions
- Reduced support requests about upload process
- Improved user satisfaction with the upload experience
- No more confusion about what "Next" button does

## Files That Need Updates

Based on the current codebase structure:
- `web/src/components/upload-flow/upload-preview-tab.tsx` - Replace "Next" with "Upload & Extract"
- `web/src/components/upload-flow/processing-review-tab.tsx` - Add "Re-scan" and "Save Report" buttons
- `web/src/components/upload-flow/processing-overlay.tsx` - Enhance with full-screen overlay
- `web/src/components/upload-flow/success-tab.tsx` - Update success screen actions
- `web/src/components/upload-flow/upload-flow-tabs.tsx` - Remove generic navigation logic