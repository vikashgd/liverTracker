/**
 * Fresh Prisma Client Utility
 * 
 * Creates a new Prisma client for each request to prevent
 * session contamination and caching issues.
 */

import { PrismaClient } from '@/generated/prisma';

/**
 * Get a fresh Prisma client for each request
 * This prevents session contamination between users
 */
export function getFreshPrismaClient(): PrismaClient {
  // Always create a new client to prevent contamination
  const client = new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
  
  return client;
}

/**
 * Execute a database query with a fresh Prisma client
 * Automatically handles connection cleanup
 */
export async function executeWithFreshPrisma<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const prisma = getFreshPrismaClient();
  
  try {
    const result = await operation(prisma);
    return result;
  } finally {
    await prisma.$disconnect();
  }
}