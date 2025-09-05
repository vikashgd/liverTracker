/**
 * API routes for onboarding management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { 
  getUserOnboardingState,
  updateOnboardingStep,
  markProfileCompleted,
  markFirstReportUploaded,
  markSecondReportUploaded,
  markOnboardingComplete,
} from '@/lib/onboarding-utils';
import { OnboardingStep } from '@/types/onboarding';

// GET /api/onboarding - Get user's onboarding state
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const state = await getUserOnboardingState(userId);
    return NextResponse.json(state);
  } catch (error) {
    console.error('Error getting onboarding state:', error);
    return NextResponse.json(
      { error: 'Failed to get onboarding state' },
      { status: 500 }
    );
  }
}

// POST /api/onboarding - Update onboarding state
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { action, step } = body;

    let success = false;

    switch (action) {
      case 'update-step':
        if (!step || !isValidOnboardingStep(step)) {
          return NextResponse.json(
            { error: 'Invalid onboarding step' },
            { status: 400 }
          );
        }
        success = await updateOnboardingStep(userId, step);
        break;

      case 'mark-profile-completed':
        success = await markProfileCompleted(userId);
        break;

      case 'mark-first-report':
        success = await markFirstReportUploaded(userId);
        break;

      case 'mark-second-report':
        success = await markSecondReportUploaded(userId);
        break;

      case 'complete-onboarding':
        success = await markOnboardingComplete(userId);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update onboarding state' },
        { status: 500 }
      );
    }

    // Return updated state
    const updatedState = await getUserOnboardingState(userId);
    return NextResponse.json({ 
      success: true, 
      state: updatedState 
    });

  } catch (error) {
    console.error('Error updating onboarding state:', error);
    return NextResponse.json(
      { error: 'Failed to update onboarding state' },
      { status: 500 }
    );
  }
}

// Helper function to validate onboarding step
function isValidOnboardingStep(step: string): step is OnboardingStep {
  const validSteps: OnboardingStep[] = [
    'welcome',
    'profile', 
    'first-upload',
    'data-review',
    'complete'
  ];
  return validSteps.includes(step as OnboardingStep);
}