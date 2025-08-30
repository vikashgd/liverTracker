import { PrismaClient } from "@/generated/prisma";

// Simple in-memory cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const CACHE_TTL = {
  USER_PROFILE: 5 * 60 * 1000, // 5 minutes
  REPORTS_LIST: 2 * 60 * 1000, // 2 minutes
  REPORT_DETAIL: 10 * 60 * 1000, // 10 minutes
  DASHBOARD_DATA: 1 * 60 * 1000, // 1 minute
};

// Create optimized Prisma client
const createFastPrismaClient = () => {
  return new PrismaClient({
    log: [],
    errorFormat: "minimal",
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

export const fastPrisma = global.prisma ?? createFastPrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = fastPrisma;

// Cache utilities
export function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data as T;
}

export function setCache<T>(key: string, data: T, ttl: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// Fast database operations with caching
export async function fastGetUser(userId: string) {
  const cacheKey = `user:${userId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const user = await fastPrisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      createdAt: true,
      emailVerified: true,
    },
  });

  if (user) {
    setCache(cacheKey, user, CACHE_TTL.USER_PROFILE);
  }

  return user;
}

export async function fastGetReports(userId: string, limit = 10) {
  const cacheKey = `reports:${userId}:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const reports = await fastPrisma.reportFile.findMany({
    where: { userId },
    select: {
      id: true,
      objectKey: true,
      createdAt: true,
      contentType: true,
      reportType: true,
      reportDate: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  setCache(cacheKey, reports, CACHE_TTL.REPORTS_LIST);
  return reports;
}

export async function fastGetReport(reportId: string) {
  const cacheKey = `report:${reportId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const report = await fastPrisma.reportFile.findUnique({
    where: { id: reportId },
    include: {
      metrics: {
        select: {
          id: true,
          name: true,
          value: true,
          unit: true,
          category: true,
        },
      },
    },
  });

  if (report) {
    setCache(cacheKey, report, CACHE_TTL.REPORT_DETAIL);
  }

  return report;
}

// Warm up database connection
export async function warmupDatabase() {
  try {
    await fastPrisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection warmed up');
  } catch (error) {
    console.error('❌ Database warmup failed:', error);
  }
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes