'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, Heart, Stethoscope, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  calculateChildPugh, 
  extractChildPughParameters, 
  validateChildPughData,
  type ChildPughParameters,
  type ChildPughResult 
} from '@/lib/child-pugh-calculator';
import { MELDDashboard } from './meld-dashboard';

interface ProfileData {
  id?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  onDialysis: boolean;
  dialysisSessionsPerWeek?: number;
  dialysisStartDate?: string;
  dialysisType?: 'hemodialysis' | 'peritoneal' | 'other';
  ascites?: 'none' | 'mild' | 'moderate';
  encephalopathy?: 'none' | 'grade1-2' | 'grade3-4';
  liverDiseaseType?: string;
  diagnosisDate?: string;
  transplantCandidate: boolean;
  transplantListDate?: string;
  alcoholUse?: string;
  smokingStatus?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  primaryPhysician?: string;
  hepatologist?: string;
  transplantCenter?: string;
  preferredUnits: 'US' | 'International';
  timezone: string;
}

interface AutoCalculatedMedicalDashboardProps {
  charts: any[];
  initialValues?: {
    bilirubin?: number;
    creatinine?: number;
    inr?: number;
    sodium?: number;
    albumin?: number;
  };
}

export function AutoCalculatedMedicalDashboard({ charts, initialValues }: AutoCalculatedMedicalDashboardProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfileData(data.profile);
          console.log('✅ Profile data loaded for auto-calculation:', data.profile);
        }
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Auto-calculate Child-Pugh score when data is available
  const childPughResult = useMemo(() => {
    if (!isClient || !profileData) return null;

    console.log('🔄 Auto-calculating Child-Pugh score...');
    
    const labParams = extractChildPughParameters(charts);
    console.log('📊 Lab parameters:', labParams);
    console.log('👤 Profile clinical data:', {
      ascites: profileData.ascites,
      encephalopathy: profileData.encephalopathy
    });

    // Map profile ascites values to Child-Pugh format
    const mappedAscites = profileData.ascites === 'mild' ? 'slight' : profileData.ascites || 'none';
    
    const fullParams = {
      ...labParams,
      ascites: mappedAscites as 'none' | 'slight' | 'moderate',
      encephalopathy: profileData.encephalopathy || 'none'
    };

    const validation = validateChildPughData(fullParams);
    console.log('✅ Validation result:', validation);

    if (!validation.canCalculate) {
      console.log('❌ Cannot auto-calculate Child-Pugh:', validation.missingLabs, validation.missingClinical);
      return null;
    }

    const calculationParams: ChildPughParameters = {
      bilirubin: labParams.bilirubin!,
      albumin: labParams.albumin!,
      inr: labParams.inr!,
      ascites: mappedAscites as 'none' | 'slight' | 'moderate',
      encephalopathy: profileData.encephalopathy || 'none'
    };

    try {
      const result = calculateChildPugh(calculationParams);
      console.log('✅ Child-Pugh auto-calculated:', result);
      return result;
    } catch (error) {
      console.error('❌ Child-Pugh calculation error:', error);
      return null;
    }
  }, [charts, profileData, isClient]);

  // Enhanced MELD initial values with profile data
  const enhancedMELDValues = useMemo(() => {
    if (!profileData) return initialValues;

    return {
      ...initialValues,
      profileData: {
        gender: profileData.gender === 'other' ? undefined : profileData.gender,
        onDialysis: profileData.onDialysis,
        dialysisSessionsPerWeek: profileData.dialysisSessionsPerWeek,
        dialysisType: profileData.dialysisType
      }
    };
  }, [initialValues, profileData]);

  const getProfileCompleteness = () => {
    if (!profileData) return 0;
    
    const criticalFields = [
      'gender', 'dateOfBirth', 'onDialysis', 'ascites', 'encephalopathy',
      'liverDiseaseType', 'primaryPhysician', 'emergencyContactName'
    ];
    
    const completed = criticalFields.filter(field => {
      const value = profileData[field as keyof ProfileData];
      return value !== undefined && value !== null && value !== '';
    }).length;
    
    return Math.round((completed / criticalFields.length) * 100);
  };

  const calculateAge = () => {
    if (!profileData?.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(profileData.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
        <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Beautiful Header */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl text-white">🧪</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 bg-clip-text text-transparent">
              Medical Scoring Dashboard
            </h2>
            <p className="text-gray-600 mt-1">
              Automated MELD 3.0 and Child-Pugh calculations from your data
            </p>
          </div>
        </div>
      </div>

      {/* Beautiful Profile Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Profile Integration</h3>
                <p className="text-gray-600">Data completeness for accurate scoring</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl font-semibold ${
              getProfileCompleteness() >= 80 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                : 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200'
            }`}>
              {getProfileCompleteness()}% Complete
            </div>
          </div>
          <div>
            {profileData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Patient Info</div>
                    <div className="font-semibold text-gray-900">
                      {profileData.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1) : 'Not specified'}
                      {calculateAge() && `, ${calculateAge()} years`}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Dialysis Status</div>
                    <div className="font-semibold">
                      {profileData.onDialysis ? (
                        <span className="text-orange-600">On Dialysis</span>
                      ) : (
                        <span className="text-green-600">Not on Dialysis</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Clinical Assessment</div>
                    <div className="font-semibold">
                      {(profileData.ascites && profileData.ascites !== 'none') || 
                       (profileData.encephalopathy && profileData.encephalopathy !== 'none') ? (
                        <span className="text-blue-600">Complete</span>
                      ) : (
                        <span className="text-yellow-600">Partial</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Profile Completeness</span>
                    <span className="font-medium text-gray-900">{getProfileCompleteness()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        getProfileCompleteness() >= 80 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                          : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                      }`}
                      style={{ width: `${getProfileCompleteness()}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Profile Data Found</h3>
                <p className="text-gray-600 mb-6">Complete your profile to enable automatic scoring</p>
                <Link 
                  href="/profile" 
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Settings className="w-4 h-4" />
                  <span>Complete Profile</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Beautiful Medical Scores Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* MELD Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">MELD Score</h3>
                  <p className="text-gray-600">Auto-calculated from your data</p>
                </div>
              </div>
            </div>
            <div>
              <MELDDashboard 
                initialValues={enhancedMELDValues}
                onScoreCalculated={(result) => {
                  console.log('🧮 MELD Score auto-calculated:', result);
                }}
                hideManualInputs={true}
                autoCalculate={true}
              />
            </div>
          </div>
        </motion.div>

        {/* Child-Pugh Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Child-Pugh Score</h3>
                  <p className="text-gray-600">Auto-calculated from your data</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {childPughResult ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-2">
                      {childPughResult.score}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-3">Class {childPughResult.class}</div>
                    <div className={`inline-flex items-center px-4 py-2 rounded-xl font-semibold ${
                      childPughResult.class === 'A' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' :
                      childPughResult.class === 'B' ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200' :
                      'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
                    }`}>
                      {childPughResult.interpretation.severity}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-4">Parameter Breakdown</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Bilirubin</span>
                          <span className="font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-lg">
                            {childPughResult.breakdown.bilirubin.points} points
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Albumin</span>
                          <span className="font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-lg">
                            {childPughResult.breakdown.albumin.points} points
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">INR</span>
                          <span className="font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-lg">
                            {childPughResult.breakdown.inr.points} points
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Ascites</span>
                          <span className="font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-lg">
                            {childPughResult.breakdown.ascites.points} points
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Encephalopathy</span>
                          <span className="font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-lg">
                            {childPughResult.breakdown.encephalopathy.points} points
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                      <h4 className="font-semibold text-gray-900 mb-3">Clinical Interpretation</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Severity:</span>
                          <span className="font-semibold text-gray-900">{childPughResult.interpretation.severity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">1-year survival:</span>
                          <span className="font-semibold text-gray-900">{childPughResult.interpretation.survival}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Operative mortality:</span>
                          <span className="font-semibold text-gray-900">{childPughResult.interpretation.mortality}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-100">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mt-0.5">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Auto-Calculated from Profile</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            This score was automatically calculated using your profile data and latest lab results.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Cannot Calculate Child-Pugh Score</h3>
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="text-sm text-gray-600">
                      {(() => {
                        const labParams = extractChildPughParameters(charts);
                        const validation = validateChildPughData({
                          ...labParams,
                          ascites: profileData?.ascites === 'mild' ? 'slight' : profileData?.ascites || 'none',
                          encephalopathy: profileData?.encephalopathy || 'none'
                        });
                        
                        const missingItems = [...validation.missingLabs, ...validation.missingClinical];
                        
                        return (
                          <>
                            <p className="font-medium text-gray-700 mb-2">Missing required data:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {missingItems.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link 
                      href="/profile" 
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-violet-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Complete Profile</span>
                    </Link>
                    <Link 
                      href="/manual-entry" 
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Add Lab Data</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}