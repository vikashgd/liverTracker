/**
 * Database Warmup Utility
 * Keeps Neon database active and handles sleeping database issues
 */

import { prisma } from '@/lib/db';

let lastWarmup = 0;
const WARMUP_INTERVAL = 30 * 60 * 1000; // 30 minutes (optimized for cost - was 4 minutes)

/**
 * Wake up the database with retry logic
 */
export async function wakeDatabase(): Promise<boolean> {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Simple query to wake up the database
      await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Database is awake');
      return true;
    } catch (error) {
      retries++;
      console.log(`⏳ Database wake attempt ${retries}/${maxRetries}...`);
      
      if (retries < maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.error('❌ Failed to wake database after', maxRetries, 'attempts');
        return false;
      }
    }
  }
  
  return false;
}

/**
 * Warmup database if needed
 */
export async function warmupIfNeeded(): Promise<void> {
  const now = Date.now();
  
  // Only warmup if enough time has passed
  if (now - lastWarmup > WARMUP_INTERVAL) {
    lastWarmup = now;
    
    try {
      await wakeDatabase();
    } catch (error) {
      console.error('Database warmup failed:', error);
    }
  }
}

/**
 * Execute database operation with automatic warmup
 */
export async function withDatabaseWarmup<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // If database connection fails, try to wake it up and retry
    if (error instanceof Error && error.message.includes("Can't reach database server")) {
      console.log('🔄 Database appears to be sleeping, attempting to wake...');
      
      const wakeSuccess = await wakeDatabase();
      if (wakeSuccess) {
        console.log('🔄 Retrying operation after database wake...');
        return await operation();
      }
    }
    
    throw error;
  }
}

/**
 * Start periodic database warmup
 */
export function startDatabaseWarmup(): void {
  // Initial warmup
  warmupIfNeeded();
  
  // Periodic warmup
  setInterval(() => {
    warmupIfNeeded();
  }, WARMUP_INTERVAL);
  
  console.log('🔥 Database warmup started (every 30 minutes - optimized for cost)');
}