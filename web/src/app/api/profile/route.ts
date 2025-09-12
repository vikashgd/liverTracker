import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { PrismaClient } from '@/generated/prisma';
import { markProfileCompleted } from '@/lib/onboarding-utils';

// Create a fresh Prisma client for each request to prevent connection sharing
function createFreshPrismaClient() {
  return new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

export async function GET(request: NextRequest) {
  const prisma = createFreshPrismaClient();
  
  try {
    console.log('🔍 Profile GET request received');
    
    // Get session directly to avoid any caching issues
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('❌ No authenticated session found');
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );
    }

    const userId = session.user.id;
    console.log('🔐 Authenticated user ID:', userId);
    console.log('📧 User email:', session.user.email);

    // Get user from database with explicit user ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found in database for ID:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('👤 Database user found:', user.email, 'ID:', user.id);

    // Get profile data with explicit user ID check
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: userId }
    });

    console.log('📊 Profile data for user', user.email, ':', profile ? 'Found' : 'Not found');
    
    if (profile) {
      console.log('📋 Profile details - Gender:', profile.gender, 'DOB:', profile.dateOfBirth);
    }

    const response = { 
      profile: profile ? {
        ...profile,
        name: user.name // Include user name in profile response
      } : null,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      debug: {
        userId: user.id,
        userEmail: user.email,
        sessionUserId: userId,
        timestamp: new Date().toISOString(),
        hasProfile: !!profile
      }
    };

    console.log('✅ Returning profile data for:', user.email, 'Session ID:', userId);
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'X-User-ID': userId // For debugging
      }
    });

  } catch (error) {
    console.error('❌ Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  const prisma = createFreshPrismaClient();
  
  try {
    console.log('📝 Profile POST request received');
    
    // Get session directly to avoid any caching issues
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('❌ No authenticated session found for POST');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('🔐 Authenticated user ID for POST:', userId);
    console.log('📧 User email for POST:', session.user.email);

    const profileData = await request.json();
    console.log('📋 Received profile data for user:', session.user.email);

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found in database for POST, ID:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('👤 Verified user for POST:', user.email, 'ID:', user.id);

    // Extract name field for User model, rest for PatientProfile
    const { name, ...patientProfileData } = profileData;

    // Update user name if provided
    if (name !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: name || null }
      });
      console.log('📝 Updated user name for:', user.email);
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
    
    console.log('💾 Saving profile for user:', user.email, 'Complete:', isProfileComplete);
    
    // Upsert profile (create or update) with explicit user ID
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

    console.log('✅ Profile saved for user:', user.email, 'Gender:', profile.gender);

    // Mark onboarding profile step as completed if profile is complete
    if (isProfileComplete) {
      await markProfileCompleted(userId);
      console.log('🎯 Onboarding marked complete for:', user.email);
    }

    return NextResponse.json({ 
      success: true, 
      profile,
      message: 'Profile saved successfully',
      onboardingUpdated: isProfileComplete,
      debug: {
        userId: userId,
        userEmail: user.email,
        profileGender: profile.gender,
        profileDOB: profile.dateOfBirth
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'X-User-ID': userId
      }
    });

  } catch (error) {
    console.error('❌ Profile POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}