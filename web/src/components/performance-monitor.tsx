/**
 * Client-side performance monitoring
 */

'use client';

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    const measurePerformance = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          const metrics = {
            'DNS Lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
            'TCP Connection': navigation.connectEnd - navigation.connectStart,
            'TLS Handshake': navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
            'Request': navigation.responseStart - navigation.requestStart,
            'Response': navigation.responseEnd - navigation.responseStart,
            'DOM Processing': navigation.domContentLoadedEventStart - navigation.responseEnd,
            'Resource Loading': navigation.loadEventStart - navigation.domContentLoadedEventStart,
            'Total Load Time': navigation.loadEventEnd - navigation.fetchStart,
          };

          console.group('🚀 Performance Metrics');
          Object.entries(metrics).forEach(([name, time]) => {
            if (time > 0) {
              const color = time > 1000 ? 'color: red' : time > 500 ? 'color: orange' : 'color: green';
              console.log(`%c${name}: ${time.toFixed(2)}ms`, color);
            }
          });
          console.groupEnd();

          // Warn about slow operations
          if (metrics['Total Load Time'] > 3000) {
            console.warn('⚠️ Slow page load detected. Consider optimizing database queries or adding caching.');
          }
        }
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  return null;
}