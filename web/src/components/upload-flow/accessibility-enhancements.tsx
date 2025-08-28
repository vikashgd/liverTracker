"use client";

import React, { useEffect, useRef, useState } from 'react';
import { ClientOnly, useIsClient, useSafeMediaQuery } from '@/lib/hydration-safe';

export interface AccessibilityAnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
}

export function AccessibilityAnnouncer({ 
  message, 
  priority = 'polite', 
  clearAfter = 5000 
}: AccessibilityAnnouncerProps) {
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && announcerRef.current) {
      // Clear and set new message
      announcerRef.current.textContent = '';
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message;
        }
      }, 100);

      // Clear message after specified time
      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          if (announcerRef.current) {
            announcerRef.current.textContent = '';
          }
        }, clearAfter);
        return () => clearTimeout(timer);
      }
    }
  }, [message, clearAfter]);

  return (
    <ClientOnly fallback={<div className="sr-only" />}>
      <div
        ref={announcerRef}
        aria-live={priority}
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
    </ClientOnly>
  );
}

export function useAccessibilityAnnouncer() {
  const [announcement, setAnnouncement] = useState('');
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');

  const announce = (message: string, announcementPriority: 'polite' | 'assertive' = 'polite') => {
    setPriority(announcementPriority);
    setAnnouncement(message);
  };

  const AnnouncerComponent = () => (
    <AccessibilityAnnouncer message={announcement} priority={priority} />
  );

  return { announce, AnnouncerComponent };
}

// Keyboard navigation helper
export function useKeyboardNavigation(
  onNext?: () => void,
  onPrevious?: () => void,
  onEscape?: () => void
) {
  const isClient = useIsClient();

  useEffect(() => {
    if (!isClient) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't interfere with form inputs
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
          if (onNext) {
            event.preventDefault();
            onNext();
          }
          break;
        case 'Tab':
          if (!event.shiftKey && onNext) {
            event.preventDefault();
            onNext();
          } else if (event.shiftKey && onPrevious) {
            event.preventDefault();
            onPrevious();
          }
          break;
        case 'ArrowLeft':
          if (onPrevious) {
            event.preventDefault();
            onPrevious();
          }
          break;
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrevious, onEscape, isClient]);
}

// Focus management helper
export function useFocusManagement() {
  const focusRef = useRef<HTMLElement>(null);

  const focusElement = (element?: HTMLElement | null) => {
    const targetElement = element || focusRef.current;
    if (targetElement) {
      targetElement.focus();
    }
  };

  const trapFocus = (containerRef: React.RefObject<HTMLElement>) => {
    const isClient = useIsClient();

    useEffect(() => {
      if (!isClient) return;
      
      const container = containerRef.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      container.addEventListener('keydown', handleTabKey);
      return () => container.removeEventListener('keydown', handleTabKey);
    }, [containerRef, isClient]);
  };

  return { focusRef, focusElement, trapFocus };
}

// Reduced motion detection
export function useReducedMotion() {
  const { matches } = useSafeMediaQuery('(prefers-reduced-motion: reduce)');
  return matches;
}

// High contrast detection
export function useHighContrast() {
  const { matches } = useSafeMediaQuery('(prefers-contrast: high)');
  return matches;
}