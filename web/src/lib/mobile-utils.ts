/**
 * Mobile detection and optimization utilities
 */

export function isMobileUserAgent(userAgent: string): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

export function isTabletUserAgent(userAgent: string): boolean {
  return /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)|Android(?=.*\bTablet\b)/i.test(userAgent);
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function getViewportHeight(): number {
  if (typeof window === 'undefined') return 0;
  return window.innerHeight;
}

export function preventZoomOnInput() {
  if (typeof document === 'undefined') return;
  
  // Add meta tag to prevent zoom on input focus (iOS)
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    const content = viewport.getAttribute('content');
    if (content && !content.includes('user-scalable=no')) {
      viewport.setAttribute('content', content + ', user-scalable=no');
    }
  }
}

export function enableZoomOnInput() {
  if (typeof document === 'undefined') return;
  
  // Remove zoom prevention
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    const content = viewport.getAttribute('content');
    if (content) {
      const newContent = content.replace(', user-scalable=no', '').replace('user-scalable=no,', '').replace('user-scalable=no', '');
      viewport.setAttribute('content', newContent);
    }
  }
}

export function handleMobileKeyboard() {
  if (typeof window === 'undefined') return;
  
  // Handle mobile keyboard appearance/disappearance
  let initialViewportHeight = window.innerHeight;
  
  const handleResize = () => {
    const currentHeight = window.innerHeight;
    const heightDifference = initialViewportHeight - currentHeight;
    
    // If height decreased significantly, keyboard is likely open
    if (heightDifference > 150) {
      document.body.classList.add('keyboard-open');
    } else {
      document.body.classList.remove('keyboard-open');
    }
  };
  
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}

export function optimizeForMobile() {
  if (typeof document === 'undefined') return;
  
  // Add mobile-specific CSS classes
  document.body.classList.add('mobile-optimized');
  
  // Prevent zoom on input focus
  preventZoomOnInput();
  
  // Handle keyboard
  const cleanup = handleMobileKeyboard();
  
  return cleanup;
}

export function getMobileBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function addMobileStyles() {
  if (typeof document === 'undefined') return;
  
  const style = document.createElement('style');
  style.textContent = `
    .mobile-optimized {
      -webkit-text-size-adjust: 100%;
      -webkit-tap-highlight-color: transparent;
    }
    
    .mobile-optimized input,
    .mobile-optimized textarea,
    .mobile-optimized select {
      font-size: 16px !important; /* Prevent zoom on iOS */
    }
    
    .keyboard-open {
      height: 100vh;
      overflow: hidden;
    }
    
    @media (max-width: 640px) {
      .mobile-optimized .auth-form {
        padding: 1rem;
      }
      
      .mobile-optimized .auth-button {
        min-height: 48px;
        font-size: 16px;
      }
      
      .mobile-optimized .auth-input {
        min-height: 48px;
        font-size: 16px;
        padding: 12px 16px;
      }
    }
  `;
  
  document.head.appendChild(style);
}

export interface MobileAuthConfig {
  preventZoom: boolean;
  optimizeKeyboard: boolean;
  addMobileStyles: boolean;
  forceMinHeight: boolean;
}

export function initializeMobileAuth(config: Partial<MobileAuthConfig> = {}) {
  const defaultConfig: MobileAuthConfig = {
    preventZoom: true,
    optimizeKeyboard: true,
    addMobileStyles: true,
    forceMinHeight: true
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  
  if (finalConfig.addMobileStyles) {
    addMobileStyles();
  }
  
  if (finalConfig.preventZoom) {
    preventZoomOnInput();
  }
  
  let keyboardCleanup: (() => void) | undefined;
  
  if (finalConfig.optimizeKeyboard) {
    keyboardCleanup = handleMobileKeyboard();
  }
  
  return () => {
    if (keyboardCleanup) {
      keyboardCleanup();
    }
    enableZoomOnInput();
  };
}