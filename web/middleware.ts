import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authSecurityMiddleware, securityHeadersMiddleware } from "./src/middleware/auth-security";
import { mobileAuthMiddleware } from "./src/middleware/mobile-auth-middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/reports', '/profile', '/settings', '/ai-intelligence', '/scoring', '/imaging'];
  const authRoutes = ['/auth/signin', '/auth/signup', '/auth/forgot-password', '/auth/reset-password'];

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Get the JWT token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Not authenticated - redirect to sign in
    if (!token) {
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthRoute) {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
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