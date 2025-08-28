"use client";

import React, { useEffect, useState, ReactNode } from 'react';

/**
 * A component that prevents hydration mismatches by only rendering children on the client
 */
export function ClientOnly({ 
  children, 
  fallback = null 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to safely detect if we're on the client side
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook for safely accessing browser APIs that might not exist during SSR
 */
export function useSafeWindow() {
  const [windowObj, setWindowObj] = useState<Window | null>(null);

  useEffect(() => {
    setWindowObj(window);
  }, []);

  return windowObj;
}

/**
 * Component for safely rendering dynamic content that might differ between server and client
 */
export function HydrationSafe({ 
  children, 
  fallback,
  suppressHydrationWarning = true 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
  suppressHydrationWarning?: boolean;
}) {
  const isClient = useIsClient();

  return (
    <div suppressHydrationWarning={suppressHydrationWarning}>
      {isClient ? children : fallback}
    </div>
  );
}

/**
 * Hook for safely using media queries without hydration issues
 */
export function useSafeMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia(query);
      setMatches(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setMatches(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [query]);

  return { matches: isClient ? matches : false, isClient };
}

/**
 * Safe localStorage hook that handles SSR
 */
export function useSafeLocalStorage<T>(
  key: string, 
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (isClient) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}