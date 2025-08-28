# Upload Flow Progress Indicator

A comprehensive progress indicator component system for the mobile upload flow enhancement. This component provides visual feedback for the multi-step upload process with professional medical design system styling.

## Components

### ProgressIndicator

The main progress indicator component that displays the complete flow progress.

```tsx
import { ProgressIndicator } from '@/components/upload-flow';

<ProgressIndicator
  currentStep={2}
  completedSteps={[1]}
  onStepClick={handleStepClick}
  canNavigateToStep={canNavigateToStep}
/>
```

**Props:**
- `currentStep`: The currently active step (1, 2, or 3)
- `completedSteps`: Array of completed step numbers
- `onStepClick?`: Callback when a step is clicked (enables navigation)
- `canNavigateToStep?`: Function to determine if navigation to a step is allowed
- `className?`: Additional CSS classes

### ProgressStep

Individual step component used within the progress indicator.

```tsx
import { ProgressStep } from '@/components/upload-flow';

<ProgressStep
  stepNumber={1}
  title="Upload & Preview"
  isActive={true}
  isCompleted={false}
  isClickable={true}
  onClick={handleClick}
/>
```

**Props:**
- `stepNumber`: Step number (1, 2, or 3)
- `title`: Display title for the step
- `isActive`: Whether this step is currently active
- `isCompleted`: Whether this step has been completed
- `isClickable?`: Whether the step can be clicked
- `onClick?`: Click handler function

## Features

### Visual States

- **Default**: Gray circle with step number
- **Active**: Blue gradient circle with pulsing animation
- **Completed**: Green gradient circle with checkmark icon
- **Clickable**: Hover effects and focus states for navigation

### Responsive Design

- **Mobile**: Compact layout with smaller circles and truncated text
- **Tablet**: Medium-sized layout with balanced spacing
- **Desktop**: Full-sized layout with optimal spacing

### Accessibility

- **ARIA Labels**: Comprehensive labeling for screen readers
- **Keyboard Navigation**: Full keyboard support with Tab and Enter/Space
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user's motion preferences
- **Focus Management**: Proper focus indicators and management

### Animations

- **Pulse Effect**: Active step has subtle pulsing animation
- **Completion Animation**: Bounce effect when step completes
- **Smooth Transitions**: All state changes are smoothly animated
- **Connector Animation**: Progressive filling of connector lines

## Styling

The component uses the medical design system with:

- **Colors**: Medical blue for active, green for completed, gray for default
- **Typography**: Clear, readable fonts optimized for medical applications
- **Spacing**: Touch-friendly spacing for mobile devices
- **Shadows**: Subtle elevation for depth and hierarchy

## Usage Examples

### Basic Usage

```tsx
function UploadFlow() {
  const { state } = useUploadFlow();
  
  return (
    <ProgressIndicator
      currentStep={state.currentTab}
      completedSteps={getCompletedSteps(state)}
    />
  );
}
```

### With Navigation

```tsx
function UploadFlowWithNavigation() {
  const { state, navigateToTab } = useUploadFlow();
  const { canNavigateToTab } = useTabNavigation(state);
  
  return (
    <ProgressIndicator
      currentStep={state.currentTab}
      completedSteps={getCompletedSteps(state)}
      onStepClick={navigateToTab}
      canNavigateToStep={canNavigateToTab}
    />
  );
}
```

### Custom Styling

```tsx
<ProgressIndicator
  currentStep={2}
  completedSteps={[1]}
  className="my-custom-progress"
/>
```

## Testing

The component includes comprehensive tests covering:

- **Rendering**: All visual states and content
- **Interaction**: Click and keyboard navigation
- **Accessibility**: ARIA attributes and screen reader support
- **State Management**: Proper state transitions and updates
- **Edge Cases**: Various completion states and error conditions

Run tests with:
```bash
npm run test:run -- src/components/upload-flow/__tests__/progress-indicator.test.tsx
```

## Integration

The progress indicator integrates seamlessly with:

- **Upload Flow State**: Uses the core state management system
- **Tab Navigation**: Works with tab validation and navigation hooks
- **Medical Design System**: Follows established design patterns
- **Existing Components**: Compatible with current UI components

## Browser Support

- **Modern Browsers**: Full support for Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: Optimized for iOS Safari and Chrome Mobile
- **Accessibility Tools**: Compatible with screen readers and assistive technology

## Performance

- **Lightweight**: Minimal bundle size impact
- **Efficient Rendering**: Optimized React rendering with proper memoization
- **CSS Animations**: Hardware-accelerated animations for smooth performance
- **Memory Management**: Proper cleanup of event listeners and resources