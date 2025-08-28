import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useNetworkStatus } from '../use-network-status';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    type: 'wifi',
    effectiveType: '4g',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
});

// Mock fetch for connectivity check
global.fetch = vi.fn();

describe('useNetworkStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigator.onLine = true;
    (navigator as any).connection = {
      type: 'wifi',
      effectiveType: '4g',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with online status', () => {
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.connectionType).toBe('wifi');
    expect(result.current.effectiveType).toBe('4g');
    expect(result.current.isSlowConnection).toBe(false);
  });

  it('detects offline status', () => {
    navigator.onLine = false;
    
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.isOnline).toBe(false);
  });

  it('detects slow connection', () => {
    (navigator as any).connection.effectiveType = '2g';
    
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.isSlowConnection).toBe(true);
  });

  it('detects very slow connection', () => {
    (navigator as any).connection.effectiveType = 'slow-2g';
    
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.isSlowConnection).toBe(true);
  });

  it('handles missing connection API gracefully', () => {
    delete (navigator as any).connection;
    
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.connectionType).toBe('unknown');
    expect(result.current.effectiveType).toBe('unknown');
    expect(result.current.isSlowConnection).toBe(false);
  });

  it('adds event listeners on mount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const connectionAddEventListenerSpy = vi.fn();
    
    (navigator as any).connection = {
      type: 'wifi',
      effectiveType: '4g',
      addEventListener: connectionAddEventListenerSpy,
      removeEventListener: vi.fn()
    };
    
    renderHook(() => useNetworkStatus());
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(connectionAddEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('removes event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const connectionRemoveEventListenerSpy = vi.fn();
    
    (navigator as any).connection = {
      type: 'wifi',
      effectiveType: '4g',
      addEventListener: vi.fn(),
      removeEventListener: connectionRemoveEventListenerSpy
    };
    
    const { unmount } = renderHook(() => useNetworkStatus());
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(connectionRemoveEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('checks connectivity successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true
    });
    
    const { result } = renderHook(() => useNetworkStatus());
    
    const isConnected = await result.current.checkConnectivity();
    
    expect(isConnected).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/health', {
      method: 'HEAD',
      cache: 'no-cache'
    });
  });

  it('handles connectivity check failure', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
    
    const { result } = renderHook(() => useNetworkStatus());
    
    const isConnected = await result.current.checkConnectivity();
    
    expect(isConnected).toBe(false);
  });

  it('handles connectivity check with non-ok response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false
    });
    
    const { result } = renderHook(() => useNetworkStatus());
    
    const isConnected = await result.current.checkConnectivity();
    
    expect(isConnected).toBe(false);
  });

  it('refreshes network status', () => {
    const { result } = renderHook(() => useNetworkStatus());
    
    // Change navigator state
    navigator.onLine = false;
    (navigator as any).connection.effectiveType = '2g';
    
    act(() => {
      result.current.refresh();
    });
    
    expect(result.current.isOnline).toBe(false);
    expect(result.current.isSlowConnection).toBe(true);
  });
});