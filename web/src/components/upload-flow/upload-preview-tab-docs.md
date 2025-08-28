# Upload Preview Tab Component

The UploadPreviewTab component is the first tab in the mobile upload flow enhancement. It handles file selection, preview, and validation before proceeding to the AI processing stage.

## Features

### File Upload Options
- **File Picker**: Upload PDF or image files from device storage
- **Camera Integration**: Take photos directly using device camera
- **Multiple Files**: Support for selecting multiple files at once
- **Add More Files**: Ability to add additional files to existing selection

### File Preview System
- **Image Previews**: Thumbnail previews for image files (JPG, PNG, HEIC)
- **PDF Indicators**: File icon with filename for PDF documents
- **File Information**: Display filename, size, and type for each file
- **File Management**: Individual delete buttons for each file

### Mobile Optimization
- **Touch Targets**: Large, touch-friendly buttons and controls
- **Responsive Grid**: Adaptive file preview grid for different screen sizes
- **Mobile Keyboards**: Appropriate keyboard types for mobile input
- **Gesture Support**: Optimized for mobile touch interactions

### Validation & Feedback
- **File Size Display**: Shows individual and total file sizes
- **Format Support**: Clear indication of supported file formats
- **Error Handling**: User-friendly error messages with recovery options
- **Progress Feedback**: Visual feedback during file operations

## Usage

```tsx
import { UploadPreviewTab } from '@/components/upload-flow';

function MyUploadFlow() {
  const [flowState, setFlowState] = useState<UploadFlowState>({
    currentTab: 1,
    uploadedFiles: [],
    extractedData: null,
    isProcessing: false,
    isSaving: false,
    savedId: null,
    error: null
  });

  const handleFilesSelected = (files: File[]) => {
    setFlowState(prev => ({
      ...prev,
      uploadedFiles: files,
      error: null
    }));
  };

  const handleFileRemoved = (index: number) => {
    setFlowState(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index)
    }));
  };

  const handleNext = () => {
    // Proceed to next tab
    setFlowState(prev => ({ ...prev, currentTab: 2 }));
  };

  const handleClearAll = () => {
    setFlowState(prev => ({
      ...prev,
      uploadedFiles: [],
      error: null
    }));
  };

  return (
    <UploadPreviewTab
      flowState={flowState}
      onFilesSelected={handleFilesSelected}
      onFileRemoved={handleFileRemoved}
      onNext={handleNext}
      onClearAll={handleClearAll}
    />
  );
}
```

## Props Interface

```tsx
interface UploadPreviewTabProps {
  flowState: UploadFlowState;
  onFilesSelected: (files: File[]) => void;
  onFileRemoved: (index: number) => void;
  onNext: () => void;
  onClearAll: () => void;
}
```

### Prop Details

- **flowState**: Current upload flow state containing files and error information
- **onFilesSelected**: Callback when files are selected (replaces current selection)
- **onFileRemoved**: Callback when a specific file is removed by index
- **onNext**: Callback when user clicks Next button to proceed
- **onClearAll**: Callback when user clears all selected files

## Supported File Types

- **Images**: JPG, JPEG, PNG, HEIC, WebP
- **Documents**: PDF (single and multi-page)
- **Size Limits**: 10MB per file (configurable)
- **Multiple Files**: No limit on number of files (within reason)

## Accessibility Features

### ARIA Support
- **Labels**: Proper ARIA labels for all interactive elements
- **Descriptions**: Descriptive text for file inputs and buttons
- **Live Regions**: Error messages announced to screen readers
- **Roles**: Appropriate roles for custom interactive elements

### Keyboard Navigation
- **Tab Order**: Logical tab order through all interactive elements
- **Enter/Space**: Activate buttons and file inputs
- **Escape**: Clear error states or cancel operations
- **Focus Management**: Proper focus indicators and management

### Screen Reader Support
- **File Information**: Announces file names, sizes, and types
- **State Changes**: Announces when files are added or removed
- **Error Messages**: Clear error announcements with context
- **Progress Updates**: Status updates during file operations

## Responsive Design

### Mobile (< 768px)
- **Single Column**: Upload options stack vertically
- **2-Column Grid**: File previews in 2-column grid
- **Full Width**: Next button spans full width
- **Large Targets**: Minimum 44px touch targets

### Tablet (768px - 1024px)
- **Two Columns**: Upload options side by side
- **3-Column Grid**: File previews in 3-column grid
- **Balanced Layout**: Optimal spacing and sizing

### Desktop (> 1024px)
- **Two Columns**: Upload options side by side
- **4-Column Grid**: File previews in 4-column grid
- **Hover Effects**: Enhanced hover states for desktop

## Error Handling

### File Validation Errors
- **Invalid Format**: Clear message about unsupported file types
- **Size Exceeded**: Specific information about file size limits
- **Upload Failed**: Network or server error handling
- **Corrupted Files**: Detection and handling of corrupted files

### Recovery Options
- **Retry**: Option to retry failed operations
- **Remove**: Easy removal of problematic files
- **Clear All**: Quick way to start over
- **Help Text**: Guidance on resolving common issues

## Performance Optimizations

### File Handling
- **Lazy Loading**: File previews loaded on demand
- **Memory Management**: Proper cleanup of object URLs
- **Efficient Rendering**: Optimized React rendering patterns
- **Debounced Operations**: Prevent excessive re-renders

### Image Processing
- **Thumbnail Generation**: Efficient thumbnail creation
- **Format Detection**: Quick file type detection
- **Size Calculation**: Efficient file size calculations
- **Preview Optimization**: Optimized image preview rendering

## Testing

The component includes comprehensive test coverage:

### Unit Tests (27 tests)
- **Rendering**: All UI states and content
- **File Selection**: File input interactions
- **File Management**: Add, remove, and clear operations
- **Navigation**: Next button behavior and validation
- **Error Handling**: Error display and recovery
- **Accessibility**: ARIA attributes and keyboard navigation

### Test Categories
- **Initial Render**: Basic component rendering
- **File Selection**: File input functionality
- **File Preview Display**: Preview grid and information
- **File Management**: File operations and state changes
- **Navigation**: Tab navigation and validation
- **Error Handling**: Error states and messages
- **Accessibility**: Screen reader and keyboard support
- **File Type Handling**: Different file type behaviors
- **File Size Display**: Size calculations and display

### Running Tests
```bash
# Run all upload preview tab tests
npm test -- upload-preview-tab.test.tsx

# Run with coverage
npm run test:coverage -- upload-preview-tab.test.tsx

# Run in watch mode
npm run test:watch -- upload-preview-tab.test.tsx
```

## Integration

### State Management
- **Upload Flow State**: Integrates with core upload flow state
- **File State**: Manages file selection and validation state
- **Error State**: Handles and displays error conditions
- **Navigation State**: Controls tab navigation and validation

### Component Integration
- **Progress Indicator**: Works with progress indicator component
- **Medical Design System**: Uses established design tokens
- **UI Components**: Integrates with existing UI component library
- **Icon System**: Uses Lucide React icon library

### API Integration
- **File Upload**: Prepares files for upload to storage API
- **Validation**: Client-side validation before server upload
- **Error Handling**: Handles API errors gracefully
- **Progress Tracking**: Provides upload progress feedback

## Browser Compatibility

### Modern Browsers
- **Chrome**: Full support (latest 2 versions)
- **Firefox**: Full support (latest 2 versions)
- **Safari**: Full support (latest 2 versions)
- **Edge**: Full support (latest 2 versions)

### Mobile Browsers
- **iOS Safari**: Optimized for iOS devices
- **Chrome Mobile**: Full Android support
- **Samsung Internet**: Compatible with Samsung devices
- **Mobile Firefox**: Full mobile Firefox support

### Feature Support
- **File API**: Required for file selection and preview
- **Camera API**: Required for camera integration
- **Touch Events**: Required for mobile interactions
- **CSS Grid**: Required for responsive layout