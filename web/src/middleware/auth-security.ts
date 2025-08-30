import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIP, getUserAgent, detectSuspiciousActivity } from "@/lib/security-utils";

/**
 * Security middleware for authentication endpoints
 */
export async function authSecurityMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  
  // Only apply to authentication endpoints
  const authEndpoints = [
    '/api/auth/signin',
    '/api/auth/signup', 
    '/api/auth/forgot-password',
    '/api/auth/reset-password'
  ];

  if (!authEndpoints.some(endpoint => pathname.startsWith(endpoint))) {
    return null; // Continue to next middleware
  }

  const ipAddress = getClientIP(request);
  const userAgent = getUserAgent(request);

  try {
    // Check rate limit
    const rateLimit = await checkRateLimit(ipAddress);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetTime.getTime() - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime.getTime() - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toISOString()
          }
        }
      );
    }

    // Check for suspicious activity
    const suspiciousActivity = await detectSuspiciousActivity(ipAddress);
    
    if (suspiciousActivity.suspicious) {
      console.warn(`Suspicious activity detected from IP ${ipAddress}:`, suspiciousActivity.reasons);
      
      // For now, just log it. In production, you might want to:
      // - Increase rate limiting
      // - Require CAPTCHA
      // - Block the IP temporarily
      // - Send alerts to security team
    }

    // Add security headers to response
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', '10');
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toISOString());
    
    return response;

  } catch (error) {
    console.error('Auth security middleware error:', error);
    // Fail open - allow request to continue
    return null;
  }
}

/**
 * Enhanced security headers middleware
 */
export function securityHeadersMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Only add HSTS in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}