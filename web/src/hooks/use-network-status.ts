import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: 'unknown',
    effectiveType: 'unknown'
  });

  const updateNetworkStatus = useCallback(() => {
    const isOnline = navigator.onLine;
    let isSlowConnection = false;
    let connectionType = 'unknown';
    let effectiveType = 'unknown';

    // Check for Network Information API support
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connectionType = connection.type || 'unknown';
      effectiveType = connection.effectiveType || 'unknown';
      
      // Consider 2g or slow-2g as slow connections
      isSlowConnection = effectiveType === '2g' || effectiveType === 'slow-2g';
    }

    setNetworkStatus({
      isOnline,
      isSlowConnection,
      connectionType,
      effectiveType
    });
  }, []);

  useEffect(() => {
    updateNetworkStatus();

    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();
    const handleConnectionChange = () => updateNetworkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes if supported
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [updateNetworkStatus]);

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  return {
    ...networkStatus,
    checkConnectivity,
    refresh: updateNetworkStatus
  };
}