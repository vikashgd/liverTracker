/**
 * Profile Service - Centralized Profile Management
 * 
 * This service handles all profile-related operations with session management
 * and provides profile data for medical scoring calculations.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

export interface ProfileData {
  id?: string;
  userId: string;
  name?: string;
  email?: string;
  location?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  onDialysis: boolean;
  dialysisSessionsPerWeek?: number;
  dialysisStartDate?: Date;
  dialysisType?: 'hemodialysis' | 'peritoneal' | 'other';
  ascites?: 'none' | 'mild' | 'moderate';
  encephalopathy?: 'none' | 'grade1-2' | 'grade3-4';
  liverDiseaseType?: 'viral_hepatitis' | 'alcoholic' | 'nash' | 'autoimmune' | 'other';
  diagnosisDate?: Date;
  transplantCandidate: boolean;
  transplantListDate?: Date;
  alcoholUse?: 'never' | 'former' | 'current_light' | 'current_moderate' | 'current_heavy';
  smokingStatus?: 'never' | 'former' | 'current';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  primaryPhysician?: string;
  hepatologist?: string;
  transplantCenter?: string;
  preferredUnits: 'US' | 'International';
  timezone: string;
  createdAt?: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

export interface ProfileWithUser {
  profile: ProfileData | null;
  user: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
  isComplete: boolean;
}

/**
 * Get current user's profile from session
 */
export async function getCurrentUserProfile(): Promise<ProfileWithUser | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('❌ No authenticated session found');
      return null;
    }

    const userId = session.user.id;
    console.log('🔍 Fetching profile for user:', session.user.email);

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      }
    });

    if (!user) {
      console.log('❌ User not found in database');
      return null;
    }

    // Get profile data
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: userId }
    });

    const profileData: ProfileData | null = profile ? {
      ...profile,
      userId: user.id,
      name: user.name || undefined,
      email: user.email || undefined,
    } : null;

    const isComplete = !!(profile?.dateOfBirth && profile?.gender);

    console.log('✅ Profile retrieved for:', user.email, 'Complete:', isComplete);

    return {
      profile: profileData,
      user: {
        id: user.id,
        name: user.name || undefined,
        email: user.email || undefined,
        image: user.image || undefined,
      },
      isComplete
    };

  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    return null;
  }
}

/**
 * Get profile data for medical calculations (MELD, Child-Pugh)
 */
export async function getProfileForMedicalScoring(): Promise<{
  profile: ProfileData | null;
  medicalData: {
    age?: number;
    gender?: string;
    weight?: number;
    height?: number;
    onDialysis: boolean;
    dialysisSessionsPerWeek?: number;
    ascites?: string;
    encephalopathy?: string;
    liverDiseaseType?: string;
    preferredUnits: string;
  };
} | null> {
  try {
    const userProfile = await getCurrentUserProfile();
    
    if (!userProfile?.profile) {
      return null;
    }

    const profile = userProfile.profile;
    
    // Calculate age from date of birth
    const age = profile.dateOfBirth 
      ? Math.floor((Date.now() - profile.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : undefined;

    const medicalData = {
      age,
      gender: profile.gender,
      weight: profile.weight,
      height: profile.height,
      onDialysis: profile.onDialysis,
      dialysisSessionsPerWeek: profile.dialysisSessionsPerWeek,
      ascites: profile.ascites || 'none',
      encephalopathy: profile.encephalopathy || 'none',
      liverDiseaseType: profile.liverDiseaseType,
      preferredUnits: profile.preferredUnits || 'US',
    };

    console.log('🧮 Medical data prepared for scoring:', {
      age,
      gender: profile.gender,
      onDialysis: profile.onDialysis,
      ascites: profile.ascites,
      encephalopathy: profile.encephalopathy
    });

    return {
      profile,
      medicalData
    };

  } catch (error) {
    console.error('❌ Error preparing medical data:', error);
    return null;
  }
}

/**
 * Check if user has completed their profile
 */
export async function isProfileComplete(): Promise<boolean> {
  try {
    const userProfile = await getCurrentUserProfile();
    return userProfile?.isComplete || false;
  } catch (error) {
    console.error('❌ Error checking profile completion:', error);
    return false;
  }
}

/**
 * Get profile completion status with details
 */
export async function getProfileCompletionStatus(): Promise<{
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}> {
  try {
    const userProfile = await getCurrentUserProfile();
    
    if (!userProfile?.profile) {
      return {
        isComplete: false,
        missingFields: ['dateOfBirth', 'gender', 'height', 'weight'],
        completionPercentage: 0
      };
    }

    const profile = userProfile.profile;
    const requiredFields = ['dateOfBirth', 'gender', 'height', 'weight'];
    const optionalFields = ['location', 'liverDiseaseType', 'diagnosisDate', 'primaryPhysician'];
    
    const missingRequired = requiredFields.filter(field => !profile[field as keyof ProfileData]);
    const completedOptional = optionalFields.filter(field => profile[field as keyof ProfileData]);
    
    const totalFields = requiredFields.length + optionalFields.length;
    const completedFields = (requiredFields.length - missingRequired.length) + completedOptional.length;
    const completionPercentage = Math.round((completedFields / totalFields) * 100);

    return {
      isComplete: missingRequired.length === 0,
      missingFields: missingRequired,
      completionPercentage
    };

  } catch (error) {
    console.error('❌ Error checking profile completion status:', error);
    return {
      isComplete: false,
      missingFields: ['dateOfBirth', 'gender', 'height', 'weight'],
      completionPercentage: 0
    };
  }
}

/**
 * Client-side hook for profile data
 */
export async function fetchUserProfile(): Promise<ProfileWithUser | null> {
  try {
    const response = await fetch('/api/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const data = await response.json();
    
    return {
      profile: data.profile,
      user: data.user,
      isComplete: !!(data.profile?.dateOfBirth && data.profile?.gender)
    };

  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    return null;
  }
}