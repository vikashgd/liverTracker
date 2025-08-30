"use client";

import { useEffect, useState } from "react";
import { initializeMobileAuth, getMobileBreakpoint, isTouchDevice } from "@/lib/mobile-utils";

interface UseMobileAuthOptions {
  preventZoom?: boolean;
  optimizeKeyboard?: boolean;
  addMobileStyles?: boolean;
  forceMinHeight?: boolean;
}

interface MobileAuthState {
  isMobile: boolean;
  isTablet: boolean;
  isTouch: boolean;
  viewportHeight: number;
  keyboardOpen: boolean;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

export function useMobileAuth(options: UseMobileAuthOptions = {}) {
  const [state, setState] = useState<MobileAuthState>({
    isMobile: false,
    isTablet: false,
    isTouch: false,
    viewportHeight: 0,
    keyboardOpen: false,
    breakpoint: 'desktop'
  });

  useEffect(() => {
    // Initialize mobile optimizations
    const cleanup = initializeMobileAuth(options);

    // Set initial state
    const updateState = () => {
      const breakpoint = getMobileBreakpoint();
      const viewportHeight = window.innerHeight;
      
      setState(prev => ({
        ...prev,
        isMobile: breakpoint === 'mobile',
        isTablet: breakpoint === 'tablet',
        isTouch: isTouchDevice(),
        viewportHeight,
        breakpoint
      }));
    };

    updateState();

    // Handle viewport changes (keyboard, orientation)
    let initialHeight = window.innerHeight;
    
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialHeight - currentHeight;
      
      setState(prev => ({
        ...prev,
        viewportHeight: currentHeight,
        keyboardOpen: heightDifference > 150
      }));
    };

    const handleOrientationChange = () => {
      // Delay to allow orientation change to complete
      setTimeout(() => {
        initialHeight = window.innerHeight;
        updateState();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      cleanup();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return state;
}

export function useMobileViewport() {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    let initialHeight = window.innerHeight;
    setViewportHeight(initialHeight);

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialHeight - currentHeight;
      
      setViewportHeight(currentHeight);
      setKeyboardOpen(heightDifference > 150);
    };

    const handleOrientationChange = () => {
      setTimeout(() => {
        initialHeight = window.innerHeight;
        setViewportHeight(initialHeight);
        setKeyboardOpen(false);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return { viewportHeight, keyboardOpen };
}

export function useMobileBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateBreakpoint = () => {
      setBreakpoint(getMobileBreakpoint());
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);

    return () => {
      window.removeEventListener('resize', updateBreakpoint);
    };
  }, []);

  return breakpoint;
}

export function useTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  return isTouch;
}