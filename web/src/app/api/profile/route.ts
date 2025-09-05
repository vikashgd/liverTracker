import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId, getCurrentUserFromDb } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';
import { markProfileCompleted } from '@/lib/onboarding-utils';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Profile GET request received');
    const userId = await getCurrentUserId();
    
    if (!userId) {
      console.log('❌ No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and their profile using enhanced auth utilities
    const user = await getCurrentUserFromDb();
    
    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get profile data
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: user.id }
    });

    console.log('👤 Found user:', user.id);
    console.log('📊 User profile:', profile);

    const response = { 
      profile: profile ? {
        ...profile,
        name: user.name // Include user name in profile response
      } : null,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };

    console.log('✅ Returning profile data:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileData = await request.json();

    // Verify user exists
    const user = await getCurrentUserFromDb();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Extract name field for User model, rest for PatientProfile
    const { name, ...patientProfileData } = profileData;

    // Update user name if provided
    if (name !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: name || null }
      });
    }

    // Convert string dates to Date objects
    const processedData = {
      ...patientProfileData,
      dateOfBirth: patientProfileData.dateOfBirth ? new Date(patientProfileData.dateOfBirth) : null,
      diagnosisDate: patientProfileData.diagnosisDate ? new Date(patientProfileData.diagnosisDate) : null,
      transplantListDate: patientProfileData.transplantListDate ? new Date(patientProfileData.transplantListDate) : null,
      dialysisStartDate: patientProfileData.dialysisStartDate ? new Date(patientProfileData.dialysisStartDate) : null,
    };

    // Check if this completes the profile (has essential fields)
    const isProfileComplete = patientProfileData.dateOfBirth && patientProfileData.gender;
    
    // Upsert profile (create or update)
    const profile = await prisma.patientProfile.upsert({
      where: { userId: userId },
      update: {
        ...processedData,
        updatedAt: new Date(),
        // Set completedAt if this is the first time completing key fields
        completedAt: isProfileComplete && !processedData.completedAt 
          ? new Date() 
          : undefined
      },
      create: {
        userId: userId,
        ...processedData,
        completedAt: isProfileComplete ? new Date() : null
      }
    });

    // Mark onboarding profile step as completed if profile is complete
    if (isProfileComplete) {
      await markProfileCompleted(userId);
    }

    return NextResponse.json({ 
      success: true, 
      profile,
      message: 'Profile saved successfully',
      onboardingUpdated: isProfileComplete
    });

  } catch (error) {
    console.error('Profile POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}