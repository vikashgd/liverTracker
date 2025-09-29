/**
 * ULTRA SIMPLE ONBOARDING API - JUST TWO FLAGS
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { canAccessDashboard } from '@/lib/dashboard-access';

// GET /api/onboarding - Check if user can access dashboard
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canAccess = await canAccessDashboard(session.user.id);
    
    return NextResponse.json({
      canAccessDashboard: canAccess,
      needsOnboarding: !canAccess
    });
  } catch (error) {
    console.error('Error checking dashboard access:', error);
    return NextResponse.json({
      canAccessDashboard: false,
      needsOnboarding: true
    });
  }
}