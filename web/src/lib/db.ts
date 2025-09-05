import { PrismaClient } from "@/generated/prisma";

declare global {
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with enhanced connection handling for mobile/network access
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    errorFormat: "minimal",
  });
};

export const prisma: PrismaClient = 
  typeof window === 'undefined' 
    ? (global.prisma ?? createPrismaClient())
    : {} as PrismaClient; // Fallback for client-side

// Don't connect immediately - let it connect on first use
// This prevents startup errors when the database is paused

// Handle graceful shutdown (only in Node.js runtime, not Edge Runtime)
if (typeof process !== 'undefined' && process.on) {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

if (typeof window === 'undefined' && process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}


