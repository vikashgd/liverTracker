/**
 * Database warmup utility - both client and server side
 */

import { startDatabaseWarmup } from '@/lib/db-warmup';

let warmupPromise: Promise<void> | null = null;

export async function warmupDatabase(): Promise<void> {
  // Only run warmup once
  if (warmupPromise) {
    return warmupPromise;
  }

  warmupPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch('/api/warmup-db', {
        signal: controller.signal,
        cache: 'no-store'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Database warmed up successfully');
      } else {
        console.warn('⚠️ Database warmup failed:', response.status);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('⚠️ Database warmup timed out');
      } else {
        console.warn('⚠️ Database warmup error:', error);
      }
    }
  })();

  return warmupPromise;
}

// Server-side: Start continuous warmup
if (typeof window === 'undefined') {
  startDatabaseWarmup();
}

// ✅ Client-side warmup removed for cost optimization
// Database wakes automatically on first query - no need for client warmup