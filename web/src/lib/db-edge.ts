import { PrismaClient } from "@/generated/prisma";

// Edge Runtime compatible database client
// This version doesn't use Node.js APIs like process.on
let edgeClient: PrismaClient | null = null;

export function getPrismaEdge(): PrismaClient {
  if (!edgeClient) {
    edgeClient = new PrismaClient({
      log: ["error"],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      errorFormat: "minimal",
    });
  }
  return edgeClient;
}

// For use in middleware and other Edge Runtime contexts
export const prismaEdge = getPrismaEdge();