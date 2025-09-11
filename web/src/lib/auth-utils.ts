import { getServerSession } from 'next-auth';
import { authOptions } from './auth-config';
import { NextRequest } from 'next/server';

/**
 * Enhanced session validation with detailed logging
 */
export async function validateSessionWithLogging(request?: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('🔍 Session validation:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      userEmail: session?.user?.email,
      userId: session?.user?.id
    });
    
    if (!session) {
      console.log('❌ No session found');
      return { valid: false, error: 'No session' };
    }
    
    if (!session.user) {
      console.log('❌ No user in session');
      return { valid: false, error: 'No user in session' };
    }
    
    if (!session.user.id) {
      console.log('❌ No user ID in session');
      return { valid: false, error: 'No user ID in session' };
    }
    
    console.log('✅ Valid session for user:', session.user.email, 'ID:', session.user.id);
    
    return {
      valid: true,
      session,
      userId: session.user.id,
      userEmail: session.user.email
    };
    
  } catch (error) {
    console.error('❌ Session validation error:', error);
    return { valid: false, error: 'Session validation failed' };
  }
}

/**
 * Get user ID with extensive validation and logging
 */
export async function getValidatedUserId(): Promise<string | null> {
  const validation = await validateSessionWithLogging();
  
  if (!validation.valid) {
    console.log('❌ Session validation failed:', validation.error);
    return null;
  }
  
  return validation.userId || null;
}

/**
 * Require authenticated user with detailed validation
 */
export async function requireValidatedUser() {
  const validation = await validateSessionWithLogging();
  
  if (!validation.valid) {
    throw new Error(`Authentication required: ${validation.error}`);
  }
  
  return {
    userId: validation.userId!,
    userEmail: validation.userEmail!,
    session: validation.session!
  };
}