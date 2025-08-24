import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user and their profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      profile: user.profile,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileData = await request.json();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

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
      where: { userId: user.id },
      update: {
        ...processedData,
        updatedAt: new Date(),
        // Set completedAt if this is the first time completing key fields
        completedAt: profileData.dateOfBirth && profileData.gender && !profileData.completedAt 
          ? new Date() 
          : undefined
      },
      create: {
        userId: user.id,
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