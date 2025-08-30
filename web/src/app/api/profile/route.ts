import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId, getCurrentUserFromDb } from '@/lib/auth';
import { PrismaClient } from '@/generated/prisma';

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
      profile,
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

    // Convert string dates to Date objects
    const processedData = {
      ...profileData,
      dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null,
      diagnosisDate: profileData.diagnosisDate ? new Date(profileData.diagnosisDate) : null,
      transplantListDate: profileData.transplantListDate ? new Date(profileData.transplantListDate) : null,
      dialysisStartDate: profileData.dialysisStartDate ? new Date(profileData.dialysisStartDate) : null,
    };

    // Upsert profile (create or update)
    const profile = await prisma.patientProfile.upsert({
      where: { userId: userId },
      update: {
        ...processedData,
        updatedAt: new Date(),
        // Set completedAt if this is the first time completing key fields
        completedAt: profileData.dateOfBirth && profileData.gender && !profileData.completedAt 
          ? new Date() 
          : undefined
      },
      create: {
        userId: userId,
        ...processedData,
        completedAt: profileData.dateOfBirth && profileData.gender ? new Date() : null
      }
    });

    return NextResponse.json({ 
      success: true, 
      profile,
      message: 'Profile saved successfully'
    });

  } catch (error) {
    console.error('Profile POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}