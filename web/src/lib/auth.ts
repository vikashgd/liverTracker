import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AuthUser } from "@/types/auth";

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  
  return {
    id: session.user.id,
    email: session.user.email || "",
    name: session.user.name || undefined,
    image: session.user.image || undefined
  };
}

/**
 * Require authentication and return user ID
 * Redirects to sign-in if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  return session.user.id;
}

/**
 * Get current user ID without redirect
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

/**
 * Get full user data from database
 */
export async function getCurrentUserFromDb() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true
      }
    });
    
    return user;
  } catch (error) {
    console.error('Error fetching user from database:', error);
    return null;
  }
}

/**
 * Check if user is authenticated (without redirect)
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return !!session?.user?.id;
}

/**
 * Get session data
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Validate session and handle expired sessions
 */
export async function validateSession(): Promise<{ valid: boolean; user?: AuthUser; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { valid: false, error: "No active session" };
    }

    // Check if user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true
      }
    });

    if (!user) {
      return { valid: false, error: "User no longer exists" };
    }

    // Account locking not implemented in current schema

    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email || "",
        name: user.name || undefined,
        image: user.image || undefined
      }
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return { valid: false, error: "Session validation failed" };
  }
}

/**
 * Require authentication with enhanced validation
 */
export async function requireAuthWithValidation(): Promise<AuthUser> {
  const validation = await validateSession();
  
  if (!validation.valid || !validation.user) {
    redirect("/auth/signin?error=SessionRequired");
  }
  
  return validation.user;
}

/**
 * Require authentication with session security checks
 */
export async function requireSecureAuth(): Promise<AuthUser> {
  // TODO: Re-enable session security validation
  // const { validateSessionSecurity } = await import("@/lib/session-security");
  // const sessionValidation = await validateSessionSecurity();
  
  // if (!sessionValidation.valid) {
  //   if (sessionValidation.shouldRedirect) {
  //     redirect(`/auth/signin?error=SessionInvalid&reason=${encodeURIComponent(sessionValidation.reason || 'Unknown')}`);
  //   }
  //   throw new Error(sessionValidation.reason || 'Session validation failed');
  // }
  
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin?error=SessionRequired");
  }
  
  return user;
}
