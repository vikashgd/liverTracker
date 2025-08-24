import { PrismaClient } from "@/generated/prisma";

declare global {
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with enhanced connection handling for mobile/network access
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    errorFormat: "pretty",
  });
};

export const prisma: PrismaClient = global.prisma ?? createPrismaClient();

// Ensure connection is established and handle connection errors gracefully
prisma.$connect().catch((error) => {
  console.error("Failed to connect to database:", error);
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

if (process.env.NODE_ENV !== "production") global.prisma = prisma;


