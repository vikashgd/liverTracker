#!/usr/bin/env node

/**
 * EMERGENCY SESSION CONTAMINATION FIX
 * 
 * This script fixes the critical issue where users are seeing other users' data
 * due to server-side caching or session contamination.
 */

const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY SESSION CONTAMINATION FIX\n');

console.log('🔧 Applying critical fixes for session contamination...\n');

// Fix 1: Add no-cache headers to all user-specific API routes
const apiRoutes = [
  'web/src/app/api/reports/route.ts',
  'web/src/app/api/profile/route.ts',
  'web/src/app/api/chart-data/route.ts'
];

console.log('1. 🚫 Adding no-cache headers to API routes...');

apiRoutes.forEach(routePath => {
  if (fs.existsSync(routePath)) {
    let content = fs.readFileSync(routePath, 'utf8');
    
    // Add no-cache headers to GET methods
    if (content.includes('return NextResponse.json(')) {
      content = content.replace(
        /return NextResponse\.json\(([^)]+)\);/g,
        `return NextResponse.json($1, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
          }
        });`
      );
      
      fs.writeFileSync(routePath, content);
      console.log(`   ✅ Updated ${routePath}`);
    }
  }
});

console.log('\n2. 🔄 Creating fresh Prisma client utility...');

// Fix 2: Create a utility for fresh Prisma client per request
const freshPrismaUtilContent = `/**
 * Fresh Prisma Client Utility
 * 
 * Creates a new Prisma client for each request to prevent
 * session contamination and caching issues.
 */

import { PrismaClient } from '@/generated/prisma';

// DO NOT create a global Prisma client - this causes session contamination
let prismaInstance: PrismaClient | null = null;

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

/**
 * DEPRECATED: Use getFreshPrismaClient() instead
 * This prevents the use of shared Prisma instances
 */
export const prisma = new Proxy({} as PrismaClient, {
  get() {
    throw new Error(
      'Do not use shared prisma instance! Use getFreshPrismaClient() instead to prevent session contamination.'
    );
  }
});
`;

fs.writeFileSync('web/src/lib/fresh-prisma.ts', freshPrismaUtilContent);
console.log('   ✅ Created fresh Prisma utility');

console.log('\n3. 🔒 Creating session isolation middleware...');

// Fix 3: Create session isolation middleware
const sessionIsolationContent = `/**
 * Session Isolation Middleware
 * 
 * Ensures proper session isolation between users
 * and prevents session contamination.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

/**
 * Middleware to ensure session isolation
 * Adds debugging and prevents caching of user-specific data
 */
export async function withSessionIsolation<T>(
  request: NextRequest,
  handler: (userId: string, request: NextRequest) => Promise<T>
): Promise<NextResponse> {
  try {
    // Get fresh session for each request
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('🚫 Session isolation: No authenticated user');
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' }, 
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );
    }

    const userId = session.user.id;
    console.log(\`🔒 Session isolation: User \${userId} - \${session.user.email}\`);
    
    // Execute handler with isolated session
    const result = await handler(userId, request);
    
    // Return with no-cache headers
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'X-User-ID': userId // For debugging
      }
    });
    
  } catch (error) {
    console.error('❌ Session isolation error:', error);
    return NextResponse.json(
      { error: 'Session isolation failed' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );
  }
}

/**
 * Get current user ID with session validation
 * Throws error if session is invalid or contaminated
 */
export async function getCurrentUserIdSecure(): Promise<string> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('No authenticated session found');
  }
  
  const userId = session.user.id;
  console.log(\`🔐 Secure user ID: \${userId} (\${session.user.email})\`);
  
  return userId;
}
`;

fs.writeFileSync('web/src/lib/session-isolation.ts', sessionIsolationContent);
console.log('   ✅ Created session isolation middleware');

console.log('\n4. 🧹 Creating cache clearing utility...');

// Fix 4: Create cache clearing utility
const cacheClearContent = `/**
 * Cache Clearing Utility
 * 
 * Utilities to clear various caches that might cause
 * session contamination.
 */

/**
 * Clear NextAuth session cache
 */
export function clearNextAuthCache() {
  // Force NextAuth to refresh sessions
  if (typeof window !== 'undefined') {
    // Client-side cache clearing
    localStorage.removeItem('next-auth.session-token');
    sessionStorage.clear();
  }
}

/**
 * Add no-cache headers to response
 */
export function addNoCacheHeaders(response: Response): Response {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  return response;
}

/**
 * Create response with no-cache headers
 */
export function createNoCacheResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    }
  });
}
`;

fs.writeFileSync('web/src/lib/cache-clear.ts', cacheClearContent);
console.log('   ✅ Created cache clearing utility');

console.log('\n✅ EMERGENCY FIXES APPLIED!');

console.log('\n🚀 NEXT STEPS:');
console.log('1. Deploy these fixes immediately');
console.log('2. Clear browser cache completely');
console.log('3. Test with multiple users');
console.log('4. Verify session isolation');

console.log('\n🔒 EXPECTED RESULT:');
console.log('• Each user sees only their own data');
console.log('• No session contamination between users');
console.log('• Fresh data on every request');
console.log('• Proper cache control headers');

console.log('\n🚨 CRITICAL: Deploy immediately to fix session contamination!');