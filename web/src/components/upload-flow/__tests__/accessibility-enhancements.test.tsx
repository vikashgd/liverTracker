import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  AccessibilityAnnouncer, 
  useAccessibilityAnnouncer,
  useKeyboardNavigation,
  useFocusManagement,
  useReducedMotion,
  useHighContrast
} from '../accessibility-enhancements';

describe('AccessibilityAnnouncer', () => {
  it('renders with correct ARIA attributes', () => {
    render(<AccessibilityAnnouncer message="Test message" />);
    
    const announcer = screen.getByRole('status');
    expect(announcer).toHaveAttribute('aria-live', 'polite');
    expect(announcer).toHaveAttribute('aria-atomic', 'true');
    expect(announcer).toHaveClass('sr-only');
  });

  it('sets assertive priority correctly', () => {
    render(<AccessibilityAnnouncer message="Urgent message" priority="assertive" />);
    
    const announcer = screen.getByRole('status');
    expect(announcer).toHaveAttribute('aria-live', 'assertive');
  });

  it('clears message after specified time', async () => {
    vi.useFakeTimers();
    
    render(<AccessibilityAnnouncer message="Test message" clearAfter={1000} />);
    
    const announcer = screen.getByRole('status');
    
    // Initially empty, then populated
    expect(announcer).toHaveTextContent('');
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    expect(announcer).toHaveTextContent('Test message');
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(announcer).toHaveTextContent('');
    
    vi.useRealTimers();
  });
});

describe('useAccessibilityAnnouncer', () => {
  function TestComponent() {
    const { announce, AnnouncerComponent } = useAccessibilityAnnouncer();
    
    return (
      <div>
        <button onClick={() => announce('Test announcement', 'assertive')}>
          Announce
        </button>
        <AnnouncerComponent />
      </div>
    );
  }

  it('announces messages correctly', () => {
    render(<TestComponent />);
    
    const button = screen.getByText('Announce');
    fireEvent.click(button);
    
    const announcer = screen.getByRole('status');
    expect(announcer).toHaveAttribute('aria-live', 'assertive');
  });
});

describe('useKeyboardNavigation', () => {
  const mockOnNext = vi.fn();
  const mockOnPrevious = vi.fn();
  const mockOnEscape = vi.fn();

  function TestComponent() {
    useKeyboardNavigation(mockOnNext, mockOnPrevious, mockOnEscape);
    return <div>Test Component</div>;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls onNext when right arrow is pressed', () => {
    render(<TestComponent />);
    
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it('calls onPrevious when left arrow is pressed', () => {
    render(<TestComponent />);
    
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(mockOnPrevious).toHaveBeenCalledTimes(1);
  });

  it('calls onEscape when escape is pressed', () => {
    render(<TestComponent />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnEscape).toHaveBeenCalledTimes(1);
  });

  it('does not interfere with form inputs', () => {
    render(
      <div>
        <TestComponent />
        <input data-testid="test-input" />
      </div>
    );
    
    const input = screen.getByTestId('test-input');
    input.focus();
    
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect(mockOnNext).not.toHaveBeenCalled();
  });
});

describe('useFocusManagement', () => {
  function TestComponent() {
    const { focusRef, focusElement } = useFocusManagement();
    
    return (
      <div>
        <button ref={focusRef} data-testid="focus-target">
          Focus Target
        </button>
        <button onClick={() => focusElement()}>
          Focus Button
        </button>
      </div>
    );
  }

  it('focuses element when focusElement is called', () => {
    render(<TestComponent />);
    
    const focusButton = screen.getByText('Focus Button');
    const focusTarget = screen.getByTestId('focus-target');
    
    fireEvent.click(focusButton);
    
    expect(document.activeElement).toBe(focusTarget);
  });
});

describe('useReducedMotion', () => {
  const mockMatchMedia = vi.fn();

  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function TestComponent() {
    const prefersReducedMotion = useReducedMotion();
    return <div data-testid="motion-state">{prefersReducedMotion.toString()}</div>;
  }

  it('detects reduced motion preference', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    render(<TestComponent />);
    
    expect(screen.getByTestId('motion-state')).toHaveTextContent('true');
  });

  it('detects no reduced motion preference', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    render(<TestComponent />);
    
    expect(screen.getByTestId('motion-state')).toHaveTextContent('false');
  });

  it('adds and removes event listeners', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener,
      removeEventListener
    });

    const { unmount } = render(<TestComponent />);
    
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    
    unmount();
    
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});

describe('useHighContrast', () => {
  const mockMatchMedia = vi.fn();

  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function TestComponent() {
    const prefersHighContrast = useHighContrast();
    return <div data-testid="contrast-state">{prefersHighContrast.toString()}</div>;
  }

  it('detects high contrast preference', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    render(<TestComponent />);
    
    expect(screen.getByTestId('contrast-state')).toHaveTextContent('true');
  });

  it('detects no high contrast preference', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    render(<TestComponent />);
    
    expect(screen.getByTestId('contrast-state')).toHaveTextContent('false');
  });
});