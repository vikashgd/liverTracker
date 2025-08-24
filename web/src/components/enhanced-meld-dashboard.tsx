"use client";

import React, { useState, useEffect } from 'react';
import { MELDDashboard } from './meld-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Settings, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ProfileData {
  gender?: 'male' | 'female' | 'other';
  onDialysis: boolean;
  dialysisSessionsPerWeek?: number;
  dialysisType?: string;
  liverDiseaseType?: string;
  transplantCandidate: boolean;
}

interface EnhancedMELDDashboardProps {
  initialValues?: {
    bilirubin?: number;
    creatinine?: number;
    inr?: number;
    sodium?: number;
    albumin?: number;
  };
}

export function EnhancedMELDDashboard({ initialValues }: EnhancedMELDDashboardProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfileData(data.profile);
        }
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
      setProfileError('Failed to load profile data');
    } finally {
      setProfileLoading(false);
    }
  };

  // Create enhanced initial values that include profile data
  const enhancedInitialValues = {
    ...initialValues,
    // Pass profile data to MELD calculator for MELD 3.0 calculations
    profileData: profileData ? {
      gender: profileData.gender === 'other' ? undefined : profileData.gender,
      onDialysis: profileData.onDialysis,
      dialysisSessionsPerWeek: profileData.dialysisSessionsPerWeek,
      dialysisType: profileData.dialysisType
    } : undefined
  };

  const getProfileCompleteness = () => {
    if (!profileData) return 0;
    
    const criticalFields = ['gender', 'onDialysis'];
    const completed = criticalFields.filter(field => {
      const value = profileData[field as keyof ProfileData];
      return value !== undefined && value !== null && value !== '';
    }).length;
    
    return Math.round((completed / criticalFields.length) * 100);
  };

  const getMissingCriticalData = () => {
    if (!profileData) return ['Complete patient profile'];
    
    const missing: string[] = [];
    if (!profileData.gender) missing.push('Gender (required for MELD 3.0)');
    
    return missing;
  };

  return (
    <div className="space-y-6">
      {/* Profile Integration Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-medical-primary-200 bg-gradient-to-br from-medical-primary-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-medical-primary-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-medical-primary-600" />
                </div>
                <span>Profile Integration</span>
              </div>
              
              {!profileLoading && (
                <Badge 
                  variant="outline" 
                  className={getProfileCompleteness() >= 100 ? 'border-green-200 text-green-700' : 'border-yellow-200 text-yellow-700'}
                >
                  {getProfileCompleteness()}% Complete
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profileLoading ? (
              <div className="flex items-center space-x-2 text-medical-neutral-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-medical-primary-600"></div>
                <span className="text-sm">Loading profile data...</span>
              </div>
            ) : profileError ? (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{profileError}</span>
              </div>
            ) : profileData ? (
              <div className="space-y-4">
                {/* Profile Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-medical-primary-800">Current Profile Data</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-medical-neutral-600">Gender:</span>
                        <span className="font-medium text-medical-neutral-800">
                          {profileData.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1) : 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-medical-neutral-600">Dialysis Status:</span>
                        <span className="font-medium text-medical-neutral-800">
                          {profileData.onDialysis ? `Yes (${profileData.dialysisSessionsPerWeek || 0}/week)` : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-medical-neutral-600">Liver Disease:</span>
                        <span className="font-medium text-medical-neutral-800">
                          {profileData.liverDiseaseType ? profileData.liverDiseaseType.replace('_', ' ').toUpperCase() : 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-medical-neutral-600">Transplant Candidate:</span>
                        <span className="font-medium text-medical-neutral-800">
                          {profileData.transplantCandidate ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-medical-primary-800">MELD 3.0 Benefits</h4>
                    <div className="space-y-1 text-sm text-medical-primary-700">
                      {profileData.gender && (
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">✓</span>
                          <span>Gender adjustment enabled</span>
                        </div>
                      )}
                      {profileData.onDialysis && (
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">✓</span>
                          <span>Dialysis adjustment will be applied</span>
                        </div>
                      )}
                      {!profileData.gender && (
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-600">⚠</span>
                          <span>Gender needed for MELD 3.0</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Missing Data Alert */}
                {getMissingCriticalData().length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="font-medium text-yellow-800 mb-2">
                          Complete Your Profile for Maximum Accuracy
                        </h5>
                        <ul className="text-sm text-yellow-700 space-y-1 mb-3">
                          {getMissingCriticalData().map((item, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                        <Link 
                          href="/profile" 
                          className="inline-flex items-center space-x-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Complete Profile</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {getProfileCompleteness() >= 100 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div>
                        <h5 className="font-medium text-green-800">Profile Complete!</h5>
                        <p className="text-sm text-green-700">
                          Your MELD calculations will now use the most accurate MELD 3.0 standard with your clinical data.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-medical-neutral-600 mb-3">No profile data found</p>
                <Link 
                  href="/profile" 
                  className="inline-flex items-center space-x-2 text-medical-primary-600 hover:text-medical-primary-700 font-medium"
                >
                  <User className="w-4 h-4" />
                  <span>Create Profile</span>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* MELD Calculator with Profile Data */}
      <MELDDashboard 
        initialValues={enhancedInitialValues}
        onScoreCalculated={(result) => {
          // Enhanced logging with profile context
          console.log('🧮 MELD Score calculated with profile integration:', {
            score: {
              meld: result.meld,
              meldNa: result.meldNa,
              meld3: result.meld3
            },
            profileData: profileData ? {
              gender: profileData.gender,
              dialysis: profileData.onDialysis,
              dialysisSessionsPerWeek: profileData.dialysisSessionsPerWeek
            } : 'No profile data',
            accuracy: getProfileCompleteness() >= 100 ? 'Maximum (MELD 3.0)' : 'Standard'
          });
        }}
      />
    </div>
  );
}