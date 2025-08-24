import { prisma } from "./db";

/**
 * Retry database operations with exponential backoff
 * Useful for handling connection issues on mobile/network access
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (
        error instanceof Error && 
        (error.message.includes('Unique constraint') || 
         error.message.includes('Foreign key constraint'))
      ) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        console.error(`Database operation failed after ${maxRetries + 1} attempts:`, error);
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Database operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Safe database query wrapper that handles connection issues
 */
export async function safeQuery<T>(operation: () => Promise<T>): Promise<T> {
  try {
    // Ensure connection is alive
    await prisma.$queryRaw`SELECT 1`;
    return await withRetry(operation);
  } catch (error) {
    console.error("Database query failed:", error);
    
    // Try to reconnect
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      return await withRetry(operation, 2, 500);
    } catch (reconnectError) {
      console.error("Database reconnection failed:", reconnectError);
      throw error;
    }
  }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true };
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}