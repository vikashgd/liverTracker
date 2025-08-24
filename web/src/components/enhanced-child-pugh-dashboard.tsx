"use client";

import React, { useState, useEffect } from 'react';
import { ChildPughDashboard } from './child-pugh-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Settings, AlertTriangle, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ProfileData {
  gender?: 'male' | 'female' | 'other';
  ascites?: 'none' | 'mild' | 'moderate';
  encephalopathy?: 'none' | 'grade1-2' | 'grade3-4';
  liverDiseaseType?: string;
  transplantCandidate: boolean;
  onDialysis: boolean;
}

interface EnhancedChildPughDashboardProps {
  initialValues?: {
    bilirubin?: number;
    albumin?: number;
    inr?: number;
  };
  profileData?: {
    ascites?: 'none' | 'mild' | 'moderate' | string;
    encephalopathy?: 'none' | 'grade1-2' | 'grade3-4' | string;
  };
}

export function EnhancedChildPughDashboard({ initialValues, profileData: externalProfileData }: EnhancedChildPughDashboardProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (externalProfileData) {
      // Use external profile data if provided
      console.log('External profile data received:', externalProfileData);
      setProfileData({
        ascites: externalProfileData.ascites as 'none' | 'mild' | 'moderate',
        encephalopathy: externalProfileData.encephalopathy as 'none' | 'grade1-2' | 'grade3-4',
        transplantCandidate: false,
        onDialysis: false
      });
      setProfileLoading(false);
    } else {
      loadProfileData();
    }
  }, [externalProfileData]);

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

  const getProfileCompleteness = () => {
    if (!profileData) return 0;
    
    const criticalFields = ['ascites', 'encephalopathy'];
    const completed = criticalFields.filter(field => {
      const value = profileData[field as keyof ProfileData];
      return value !== undefined && value !== null && value !== '';
    }).length;
    
    return Math.round((completed / criticalFields.length) * 100);
  };

  const getMissingCriticalData = () => {
    if (!profileData) return ['Complete patient profile'];
    
    const missing: string[] = [];
    // 'none' is a valid assessment value, not missing data
    if (!profileData.ascites) {
      missing.push('Ascites assessment (required for Child-Pugh)');
    }
    if (!profileData.encephalopathy) {
      missing.push('Encephalopathy assessment (required for Child-Pugh)');
    }
    
    console.log('Profile data check:', {
      profileData,
      ascites: profileData.ascites,
      encephalopathy: profileData.encephalopathy,
      missing
    });
    
    return missing;
  };

  // Create enhanced initial values that include profile data
  const enhancedInitialValues = {
    ...initialValues,
    // Pre-populate clinical assessments from profile
    ascites: profileData?.ascites || 'none',
    encephalopathy: profileData?.encephalopathy || 'none'
  };

  return (
    <div className="space-y-6">
      {/* Profile Integration Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4 text-purple-600" />
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
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
                    <h4 className="font-medium text-purple-800">Current Profile Data</h4>
                    <div className="space-y-1 text-sm">
                      {(profileData.ascites && profileData.encephalopathy) && (
                        <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2 text-green-700">
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                            <span className="text-sm font-medium">Clinical assessments loaded from profile</span>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-medical-neutral-600">Ascites:</span>
                        <span className="font-medium text-medical-neutral-800">
                          {profileData.ascites ? profileData.ascites.charAt(0).toUpperCase() + profileData.ascites.slice(1) : 'Not assessed'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-medical-neutral-600">Encephalopathy:</span>
                        <span className="font-medium text-medical-neutral-800">
                          {profileData.encephalopathy ? profileData.encephalopathy.replace('-', ' ').toUpperCase() : 'Not assessed'}
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
                    <h4 className="font-medium text-purple-800">Child-Pugh Benefits</h4>
                    <div className="space-y-1 text-sm text-purple-700">
                      {profileData.ascites && profileData.ascites !== 'none' && (
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">✓</span>
                          <span>Ascites assessment available</span>
                        </div>
                      )}
                      {profileData.encephalopathy && profileData.encephalopathy !== 'none' && (
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">✓</span>
                          <span>Encephalopathy assessment available</span>
                        </div>
                      )}
                      {profileData.liverDiseaseType && (
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">✓</span>
                          <span>Disease context available</span>
                        </div>
                      )}
                      {(!profileData.ascites || profileData.ascites === 'none') && (
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-600">⚠</span>
                          <span>Ascites assessment needed</span>
                        </div>
                      )}
                      {(!profileData.encephalopathy || profileData.encephalopathy === 'none') && (
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-600">⚠</span>
                          <span>Encephalopathy assessment needed</span>
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
                          Complete Clinical Assessment for Accurate Child-Pugh Score
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
                          <span>Complete Clinical Assessment</span>
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
                        <h5 className="font-medium text-green-800">Clinical Assessment Complete!</h5>
                        <p className="text-sm text-green-700">
                          Your Child-Pugh calculations will now use your clinical assessment data for maximum accuracy.
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
                  className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium"
                >
                  <User className="w-4 h-4" />
                  <span>Create Profile</span>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Child-Pugh Calculator with Profile Data */}
      <ChildPughDashboard 
        initialValues={enhancedInitialValues}
        onScoreCalculated={(result) => {
          // Enhanced logging with profile context
          console.log('🫀 Child-Pugh Score calculated with profile integration:', {
            score: {
              score: result.score,
              class: result.class,
              interpretation: result.interpretation
            },
            profileData: profileData ? {
              ascites: profileData.ascites,
              encephalopathy: profileData.encephalopathy,
              liverDiseaseType: profileData.liverDiseaseType
            } : 'No profile data',
            accuracy: getProfileCompleteness() >= 100 ? 'Maximum (with clinical assessment)' : 'Standard'
          });
        }}
      />
    </div>
  );
}