"use client";

/**
 * Safe navigation utilities that work with SSR
 */

/**
 * Safely navigate to a URL, handling both client and server environments
 */
export function safeNavigate(url: string) {
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
}

/**
 * Safely open a URL in a new tab/window
 */
export function safeOpenInNewTab(url: string) {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Safely get the current URL
 */
export function safeGetCurrentUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.href;
  }
  return '';
}

/**
 * Safely get the current pathname
 */
export function safeGetPathname(): string {
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }
  return '';
}

/**
 * Hook for safe navigation that works with Next.js router
 */
export function useSafeNavigation() {
  const navigate = (url: string) => {
    safeNavigate(url);
  };

  const openInNewTab = (url: string) => {
    safeOpenInNewTab(url);
  };

  return { navigate, openInNewTab };
}