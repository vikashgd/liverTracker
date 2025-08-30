import { NextRequest, NextResponse } from "next/server";
import { authSecurityMiddleware, securityHeadersMiddleware } from "./src/middleware/auth-security";
import { mobileAuthMiddleware } from "./src/middleware/mobile-auth-middleware";

export async function middleware(request: NextRequest) {
  // Apply mobile auth middleware first
  const mobileResponse = await mobileAuthMiddleware(request);
  if (mobileResponse.status !== 200) {
    return mobileResponse;
  }

  // Apply security headers to all requests
  let response = securityHeadersMiddleware(request);

  // Apply auth security middleware to authentication endpoints
  const authSecurityResponse = await authSecurityMiddleware(request);
  if (authSecurityResponse) {
    return authSecurityResponse;
  }

  // Merge mobile headers with security headers
  const mobileHeaders = mobileResponse.headers;
  mobileHeaders.forEach((value, key) => {
    if (key.startsWith('X-Mobile') || key.startsWith('X-Enable') || key.startsWith('X-Battery') || key.startsWith('X-Offline')) {
      response.headers.set(key, value);
    }
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};