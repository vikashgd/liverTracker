/**
 * useProfile Hook - Client-side Profile Management
 * 
 * React hook for managing user profile data with session integration
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ProfileData, ProfileWithUser } from '@/lib/profile-service';

interface UseProfileReturn {
  profile: ProfileData | null;
  user: { id: string; name?: string; email?: string; image?: string } | null;
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
  completionPercentage: number;
  missingFields: string[];
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<ProfileData>) => Promise<boolean>;
}

export function useProfile(): UseProfileReturn {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [user, setUser] = useState<{ id: string; name?: string; email?: string; image?: string } | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Calculate completion status
  const calculateCompletion = useCallback((profileData: ProfileData | null) => {
    if (!profileData) {
      setIsComplete(false);
      setCompletionPercentage(0);
      setMissingFields(['dateOfBirth', 'gender', 'height', 'weight']);
      return;
    }

    const requiredFields = ['dateOfBirth', 'gender', 'height', 'weight'];
    const optionalFields = ['location', 'liverDiseaseType', 'diagnosisDate', 'primaryPhysician'];
    
    const missingRequired = requiredFields.filter(field => !profileData[field as keyof ProfileData]);
    const completedOptional = optionalFields.filter(field => profileData[field as keyof ProfileData]);
    
    const totalFields = requiredFields.length + optionalFields.length;
    const completedFields = (requiredFields.length - missingRequired.length) + completedOptional.length;
    const percentage = Math.round((completedFields / totalFields) * 100);

    setIsComplete(missingRequired.length === 0);
    setCompletionPercentage(percentage);
    setMissingFields(missingRequired);
  }, []);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Fetching profile for session user:', session.user.email);

      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('✅ Profile data received:', {
        hasProfile: !!data.profile,
        userEmail: data.user?.email,
        profileGender: data.profile?.gender
      });

      setProfile(data.profile);
      setUser(data.user);
      calculateCompletion(data.profile);

    } catch (err) {
      console.error('❌ Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      setProfile(null);
      setUser(null);
      setIsComplete(false);
      setCompletionPercentage(0);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, session?.user?.email, status, calculateCompletion]);

  // Update profile data
  const updateProfile = useCallback(async (data: Partial<ProfileData>): Promise<boolean> => {
    if (!session?.user?.id) {
      setError('Not authenticated');
      return false;
    }

    try {
      setError(null);
      
      console.log('📝 Updating profile for user:', session.user.email);

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ Profile updated successfully');

      // Refresh profile data after update
      await fetchProfile();
      
      return true;

    } catch (err) {
      console.error('❌ Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    }
  }, [session?.user?.id, session?.user?.email, fetchProfile]);

  // Refresh profile (alias for fetchProfile)
  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  // Fetch profile when session changes
  useEffect(() => {
    if (status === 'loading') {
      return; // Wait for session to load
    }

    if (status === 'unauthenticated') {
      setProfile(null);
      setUser(null);
      setIsComplete(false);
      setCompletionPercentage(0);
      setMissingFields([]);
      setIsLoading(false);
      return;
    }

    fetchProfile();
  }, [status, fetchProfile]);

  return {
    profile,
    user,
    isComplete,
    isLoading,
    error,
    completionPercentage,
    missingFields,
    refreshProfile,
    updateProfile,
  };
}

/**
 * Hook specifically for medical scoring data
 */
export function useProfileForScoring() {
  const { profile, isLoading, error } = useProfile();

  const medicalData = profile ? {
    age: profile.dateOfBirth 
      ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : undefined,
    gender: profile.gender || undefined,
    weight: profile.weight || undefined,
    height: profile.height || undefined,
    onDialysis: profile.onDialysis,
    dialysisSessionsPerWeek: profile.dialysisSessionsPerWeek || undefined,
    ascites: profile.ascites || 'none',
    encephalopathy: profile.encephalopathy || 'none',
    liverDiseaseType: profile.liverDiseaseType || undefined,
    preferredUnits: profile.preferredUnits || 'US',
  } : null;

  return {
    profile,
    medicalData,
    isLoading,
    error,
    hasRequiredData: !!(medicalData?.age && medicalData?.gender),
  };
}