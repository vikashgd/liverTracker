/**
 * Mobile-optimized authentication middleware
 * Handles mobile-specific authentication concerns
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

interface MobileAuthOptions {
  enableSessionPersistence: boolean;
  enableOfflineSupport: boolean;
  enableBatteryOptimization: boolean;
  mobileRedirectUrl?: string;
  desktopRedirectUrl?: string;
}

const DEFAULT_OPTIONS: MobileAuthOptions = {
  enableSessionPersistence: true,
  enableOfflineSupport: true,
  enableBatteryOptimization: true,
  mobileRedirectUrl: '/auth/signin?mobile=true',
  desktopRedirectUrl: '/auth/signin'
};

export function createMobileAuthMiddleware(options: Partial<MobileAuthOptions> = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return async function mobileAuthMiddleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Skip middleware for API routes and static files
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // Detect mobile device
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)|Android(?=.*\bTablet\b)/i.test(userAgent);

    // Get session token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Protected routes that require authentication
    const protectedRoutes = [
      '/dashboard',
      '/profile',
      '/reports',
      '/settings',
      '/ai-intelligence',
      '/scoring',
      '/imaging'
    ];

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // Handle authentication for protected routes
    if (isProtectedRoute && !token) {
      const redirectUrl = isMobile && !isTablet ? config.mobileRedirectUrl : config.desktopRedirectUrl;
      const callbackUrl = encodeURIComponent(pathname);
      
      return NextResponse.redirect(
        new URL(`${redirectUrl}?callbackUrl=${callbackUrl}`, request.url)
      );
    }

    // Handle mobile-specific optimizations
    const response = NextResponse.next();

    if (isMobile && !isTablet) {
      // Add mobile-specific headers
      response.headers.set('X-Mobile-Optimized', 'true');
      
      // Add viewport meta tag for mobile
      response.headers.set('X-Mobile-Viewport', 'width=device-width, initial-scale=1, user-scalable=no');
      
      // Enable session persistence
      if (config.enableSessionPersistence && token) {
        response.headers.set('X-Enable-Session-Persistence', 'true');
      }
      
      // Add battery optimization hints
      if (config.enableBatteryOptimization) {
        response.headers.set('X-Battery-Optimization', 'true');
      }
      
      // Add offline support hints
      if (config.enableOfflineSupport) {
        response.headers.set('X-Offline-Support', 'true');
      }
    }

    // Add security headers for mobile
    if (isMobile) {
      // Prevent clickjacking on mobile
      response.headers.set('X-Frame-Options', 'DENY');
      
      // Add Content Security Policy for mobile
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
      );
      
      // Add mobile-specific security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    return response;
  };
}

/**
 * Mobile device detection utilities
 */
export const mobileDetection = {
  isMobile: (userAgent: string): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  },

  isTablet: (userAgent: string): boolean => {
    return /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)|Android(?=.*\bTablet\b)/i.test(userAgent);
  },

  isIOS: (userAgent: string): boolean => {
    return /iPad|iPhone|iPod/.test(userAgent);
  },

  isAndroid: (userAgent: string): boolean => {
    return /Android/.test(userAgent);
  },

  getDeviceType: (userAgent: string): 'mobile' | 'tablet' | 'desktop' => {
    if (mobileDetection.isTablet(userAgent)) return 'tablet';
    if (mobileDetection.isMobile(userAgent)) return 'mobile';
    return 'desktop';
  },

  getBrowserInfo: (userAgent: string) => {
    const isChrome = /Chrome/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !isChrome;
    const isFirefox = /Firefox/.test(userAgent);
    const isEdge = /Edge/.test(userAgent);

    return {
      isChrome,
      isSafari,
      isFirefox,
      isEdge,
      supportsWebAuthn: isChrome || isFirefox || isEdge || (isSafari && /Version\/14/.test(userAgent))
    };
  }
};

/**
 * Mobile authentication response helpers
 */
export const mobileAuthResponse = {
  redirectToMobileAuth: (request: NextRequest, callbackUrl?: string): NextResponse => {
    const url = new URL('/auth/signin?mobile=true', request.url);
    if (callbackUrl) {
      url.searchParams.set('callbackUrl', callbackUrl);
    }
    return NextResponse.redirect(url);
  },

  redirectToDesktopAuth: (request: NextRequest, callbackUrl?: string): NextResponse => {
    const url = new URL('/auth/signin', request.url);
    if (callbackUrl) {
      url.searchParams.set('callbackUrl', callbackUrl);
    }
    return NextResponse.redirect(url);
  },

  addMobileHeaders: (response: NextResponse, options: {
    enablePersistence?: boolean;
    enableOffline?: boolean;
    enableBatteryOptimization?: boolean;
  } = {}): NextResponse => {
    response.headers.set('X-Mobile-Optimized', 'true');
    
    if (options.enablePersistence) {
      response.headers.set('X-Enable-Session-Persistence', 'true');
    }
    
    if (options.enableOffline) {
      response.headers.set('X-Offline-Support', 'true');
    }
    
    if (options.enableBatteryOptimization) {
      response.headers.set('X-Battery-Optimization', 'true');
    }
    
    return response;
  }
};

/**
 * Default mobile auth middleware instance
 */
export const mobileAuthMiddleware = createMobileAuthMiddleware();