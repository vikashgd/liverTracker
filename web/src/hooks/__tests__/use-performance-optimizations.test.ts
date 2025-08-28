import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  useDebounce, 
  useThrottle, 
  useIntersectionObserver,
  useVirtualScrolling,
  useImageOptimization,
  useMemoryManagement,
  usePerformanceMonitoring
} from '../use-performance-optimizations';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('updated');
  });

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'first', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    rerender({ value: 'second', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('second');
  });
});

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throttles function calls', () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() => useThrottle(mockFn, 1000));

    // First call should execute immediately
    result.current('arg1');
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('arg1');

    // Subsequent calls within delay should be ignored
    result.current('arg2');
    result.current('arg3');
    expect(mockFn).toHaveBeenCalledTimes(1);

    // After delay, next call should execute
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    result.current('arg4');
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenLastCalledWith('arg4');
  });
});

describe('useIntersectionObserver', () => {
  const mockIntersectionObserver = vi.fn();
  const mockObserve = vi.fn();
  const mockUnobserve = vi.fn();

  beforeEach(() => {
    mockIntersectionObserver.mockImplementation((callback) => ({
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: vi.fn()
    }));

    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      value: mockIntersectionObserver
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('observes element when ref is set', () => {
    const elementRef = { current: document.createElement('div') };
    
    renderHook(() => useIntersectionObserver(elementRef));
    
    expect(mockIntersectionObserver).toHaveBeenCalled();
    expect(mockObserve).toHaveBeenCalledWith(elementRef.current);
  });

  it('does not observe when ref is null', () => {
    const elementRef = { current: null };
    
    renderHook(() => useIntersectionObserver(elementRef));
    
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it('unobserves on unmount', () => {
    const elementRef = { current: document.createElement('div') };
    
    const { unmount } = renderHook(() => useIntersectionObserver(elementRef));
    
    unmount();
    
    expect(mockUnobserve).toHaveBeenCalledWith(elementRef.current);
  });
});

describe('useVirtualScrolling', () => {
  it('calculates visible items correctly', () => {
    const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
    const { result } = renderHook(() => 
      useVirtualScrolling(items, 50, 300)
    );

    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(7); // Math.ceil(300/50) + 1
    expect(result.current.items).toHaveLength(7);
    expect(result.current.totalHeight).toBe(5000); // 100 * 50
    expect(result.current.offsetY).toBe(0);
  });

  it('updates visible items on scroll', () => {
    const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
    const { result } = renderHook(() => 
      useVirtualScrolling(items, 50, 300)
    );

    // Simulate scroll
    const mockEvent = {
      currentTarget: { scrollTop: 250 }
    } as React.UIEvent<HTMLDivElement>;

    act(() => {
      result.current.handleScroll(mockEvent);
    });

    expect(result.current.startIndex).toBe(5); // Math.floor(250/50)
    expect(result.current.offsetY).toBe(250); // 5 * 50
  });
});

describe('useImageOptimization', () => {
  const mockCanvas = {
    getContext: vi.fn(),
    toDataURL: vi.fn(),
    toBlob: vi.fn(),
    width: 0,
    height: 0
  };

  const mockContext = {
    drawImage: vi.fn()
  };

  beforeEach(() => {
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return mockCanvas as any;
      }
      return document.createElement(tagName);
    });

    mockCanvas.getContext.mockReturnValue(mockContext);
    
    // Mock Image constructor
    global.Image = class {
      onload: (() => void) | null = null;
      src = '';
      width = 800;
      height = 600;
      
      constructor() {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    } as any;

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates thumbnail with correct dimensions', async () => {
    const { result } = renderHook(() => useImageOptimization());
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    
    mockCanvas.toDataURL.mockReturnValue('data:image/jpeg;base64,mock');

    const thumbnail = await result.current.createThumbnail(mockFile, 200, 200);
    
    expect(thumbnail).toBe('data:image/jpeg;base64,mock');
    expect(mockCanvas.width).toBe(200);
    expect(mockCanvas.height).toBe(150); // Aspect ratio maintained
  });

  it('compresses image correctly', async () => {
    const { result } = renderHook(() => useImageOptimization());
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    
    const mockBlob = new Blob(['compressed'], { type: 'image/jpeg' });
    mockCanvas.toBlob.mockImplementation((callback) => {
      callback?.(mockBlob);
    });

    const compressedFile = await result.current.compressImage(mockFile, 0.8);
    
    expect(compressedFile).toBeInstanceOf(File);
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/jpeg',
      0.8
    );
  });
});

describe('useMemoryManagement', () => {
  const mockCreateObjectURL = vi.fn();
  const mockRevokeObjectURL = vi.fn();

  beforeEach(() => {
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    
    mockCreateObjectURL.mockReturnValue('mock-url');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates and tracks object URLs', () => {
    const { result } = renderHook(() => useMemoryManagement());
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    
    const url = result.current.createObjectUrl(mockFile);
    
    expect(url).toBe('mock-url');
    expect(mockCreateObjectURL).toHaveBeenCalledWith(mockFile);
  });

  it('revokes individual object URLs', () => {
    const { result } = renderHook(() => useMemoryManagement());
    
    result.current.revokeObjectUrl('mock-url');
    
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
  });

  it('revokes all object URLs on unmount', () => {
    const { result, unmount } = renderHook(() => useMemoryManagement());
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    
    result.current.createObjectUrl(mockFile);
    
    unmount();
    
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
  });
});

describe('usePerformanceMonitoring', () => {
  beforeEach(() => {
    // Mock performance.now
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(116);

    // Mock performance.memory
    Object.defineProperty(performance, 'memory', {
      value: {
        usedJSHeapSize: 1024 * 1024 * 50 // 50MB
      },
      configurable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('measures render time correctly', () => {
    const { result } = renderHook(() => usePerformanceMonitoring());
    
    const endMeasure = result.current.measureRenderTime('TestComponent');
    endMeasure();
    
    expect(result.current.metrics.renderTime).toBe(16);
  });

  it('measures memory usage correctly', () => {
    const { result } = renderHook(() => usePerformanceMonitoring());
    
    act(() => {
      result.current.measureMemoryUsage();
    });
    
    expect(result.current.metrics.memoryUsage).toBe(50); // 50MB
  });
});