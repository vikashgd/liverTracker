import { NextRequest } from "next/server";

/**
 * Minimal security utilities for build compatibility
 * TODO: Implement full security features
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
}

export interface SuspiciousActivityResult {
  suspicious: boolean;
  reasons: string[];
}

/**
 * Basic rate limiting check (stub implementation)
 */
export async function checkRateLimit(ipAddress: string): Promise<RateLimitResult> {
  // TODO: Implement proper rate limiting with Redis/database
  return {
    allowed: true,
    remaining: 10,
    resetTime: new Date(Date.now() + 60000) // 1 minute from now
  };
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Detect suspicious activity (stub implementation)
 */
export async function detectSuspiciousActivity(ipAddress: string): Promise<SuspiciousActivityResult> {
  // TODO: Implement proper suspicious activity detection
  return {
    suspicious: false,
    reasons: []
  };
}