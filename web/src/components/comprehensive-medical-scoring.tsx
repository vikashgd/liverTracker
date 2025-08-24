"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Heart, User, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { EnhancedMELDDashboard } from './enhanced-meld-dashboard';
import { EnhancedChildPughDashboard } from './enhanced-child-pugh-dashboard';
import type { MELDResult } from '@/lib/meld-calculator';
import type { ChildPughResult } from '@/lib/meld-calculator';

interface ProfileData {
  gender?: 'male' | 'female' | 'other';
  onDialysis: boolean;
  dialysisSessionsPerWeek?: number;
  liverDiseaseType?: string;
  transplantCandidate: boolean;
}

interface ComprehensiveMedicalScoringProps {
  initialValues?: {
    bilirubin?: number;
    creatinine?: number;
    inr?: number;
    sodium?: number;
    albumin?: number;
  };
}

interface EnhancedDashboardProps {
  initialValues?: {
    bilirubin?: number;
    creatinine?: number;
    inr?: number;
    sodium?: number;
    albumin?: number;
  };
  onScoreCalculated?: (result: any) => void;
}

export function ComprehensiveMedicalScoring({ initialValues }: ComprehensiveMedicalScoringProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [meldResult, setMeldResult] = useState<MELDResult | null>(null);
  const [childPughResult, setChildPughResult] = useState<ChildPughResult | null>(null);
  const [activeTab, setActiveTab] = useState('meld');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        console.log('Profile data loaded:', data);
        if (data.profile) {
          setProfileData(data.profile);
          console.log('Profile data set:', data.profile);
        }
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const getOverallRiskAssessment = () => {
    if (!meldResult && !childPughResult) return null;

    let riskLevel = 'Low';
    let riskColor = 'text-green-600';
    let recommendations: string[] = [];

    // MELD-based risk
    if (meldResult) {
      const primaryScore = meldResult.meld3 || meldResult.meldNa || meldResult.meld;
      if (primaryScore >= 30) {
        riskLevel = 'Critical';
        riskColor = 'text-red-600';
        recommendations.push('Urgent liver transplant evaluation required');
      } else if (primaryScore >= 20) {
        riskLevel = 'High';
        riskColor = 'text-orange-600';
        recommendations.push('High priority for transplant listing');
      } else if (primaryScore >= 10) {
        riskLevel = 'Medium';
        riskColor = 'text-yellow-600';
        recommendations.push('Consider transplant evaluation');
      }
    }

    // Child-Pugh-based risk
    if (childPughResult) {
      if (childPughResult.class === 'C') {
        riskLevel = riskLevel === 'Critical' ? 'Critical' : 'High';
        riskColor = 'text-red-600';
        recommendations.push('Severely decompensated liver disease');
      } else if (childPughResult.class === 'B') {
        if (riskLevel === 'Low') {
          riskLevel = 'Medium';
          riskColor = 'text-yellow-600';
        }
        recommendations.push('Moderately decompensated liver disease');
      }
    }

    // Profile-based recommendations
    if (profileData?.transplantCandidate) {
      recommendations.push('Currently listed for liver transplantation');
    }
    if (profileData?.onDialysis) {
      recommendations.push('Dialysis status affects MELD calculation');
    }

    return {
      riskLevel,
      riskColor,
      recommendations: [...new Set(recommendations)]
    };
  };

  const getProfileCompleteness = () => {
    if (!profileData) return 0;
    
    const criticalFields = ['gender', 'onDialysis', 'liverDiseaseType'];
    const completed = criticalFields.filter(field => {
      const value = profileData[field as keyof ProfileData];
      return value !== undefined && value !== null && value !== '';
    }).length;
    
    return Math.round((completed / criticalFields.length) * 100);
  };

  const overallRisk = getOverallRiskAssessment();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-medical-primary-600 to-purple-600 text-white rounded-2xl p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Medical Scoring Dashboard</h1>
              <p className="text-blue-100 text-lg">
                Comprehensive liver disease assessment with MELD and Child-Pugh scoring
              </p>
            </div>
          </div>
          
          {overallRisk && (
            <div className="text-right">
              <div className="text-2xl font-bold text-white mb-1">
                {overallRisk.riskLevel}
              </div>
              <div className="text-blue-100 text-sm">Overall Risk</div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Integration Status */}
      {!profileLoading && (
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
                
                <Badge 
                  variant="outline" 
                  className={getProfileCompleteness() >= 100 ? 'border-green-200 text-green-700' : 'border-yellow-200 text-yellow-700'}
                >
                  {getProfileCompleteness()}% Complete
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profileData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <h4 className="font-medium text-medical-primary-800">Enhanced Accuracy</h4>
                    <div className="space-y-1 text-sm text-medical-primary-700">
                      {profileData.gender && (
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">✓</span>
                          <span>MELD 3.0 gender adjustment enabled</span>
                        </div>
                      )}
                      {profileData.onDialysis && (
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">✓</span>
                          <span>Dialysis adjustment will be applied</span>
                        </div>
                      )}
                      {profileData.liverDiseaseType && (
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">✓</span>
                          <span>Disease-specific context available</span>
                        </div>
                      )}
                      {getProfileCompleteness() < 100 && (
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-600">⚠</span>
                          <Link href="/profile" className="text-yellow-700 underline hover:text-yellow-800">
                            Complete profile for maximum accuracy
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
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
      )}

      {/* Overall Risk Assessment */}
      {overallRisk && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <span>Overall Risk Assessment</span>
                <Badge className={`${overallRisk.riskColor} bg-white border`}>
                  {overallRisk.riskLevel} Risk
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-purple-800 mb-2">Current Scores</h4>
                  <div className="space-y-2 text-sm">
                    {meldResult && (
                      <div className="flex justify-between">
                        <span>MELD Score:</span>
                        <span className="font-bold">
                          {meldResult.meld3 || meldResult.meldNa || meldResult.meld}
                          {meldResult.meld3 ? ' (MELD 3.0)' : meldResult.meldNa ? ' (MELD-Na)' : ''}
                        </span>
                      </div>
                    )}
                    {childPughResult && (
                      <div className="flex justify-between">
                        <span>Child-Pugh:</span>
                        <span className="font-bold">
                          Class {childPughResult.class} ({childPughResult.score} points)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-purple-800 mb-2">Clinical Recommendations</h4>
                  <div className="space-y-1 text-sm text-purple-700">
                    {overallRisk.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-purple-600 mt-0.5">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Scoring Calculators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meld" className="flex items-center space-x-2">
              <Calculator className="w-4 h-4" />
              <span>MELD Score</span>
            </TabsTrigger>
            <TabsTrigger value="child-pugh" className="flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>Child-Pugh Score</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meld" className="space-y-6">
            <EnhancedMELDDashboard 
              initialValues={initialValues}
            />
          </TabsContent>

          <TabsContent value="child-pugh" className="space-y-6">
            <EnhancedChildPughDashboard 
              initialValues={{
                bilirubin: initialValues?.bilirubin,
                albumin: initialValues?.albumin,
                inr: initialValues?.inr
              }}
              profileData={{
                ascites: (profileData as any)?.ascites,
                encephalopathy: (profileData as any)?.encephalopathy
              }}
            />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Medical Context */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Understanding Your Scores
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>• <strong>MELD Score:</strong> Predicts 3-month mortality risk and determines transplant priority</p>
                  <p>• <strong>Child-Pugh Score:</strong> Assesses liver disease severity and prognosis</p>
                  <p>• <strong>Profile Integration:</strong> Your clinical data enables the most accurate calculations</p>
                  <p>• <strong>Combined Assessment:</strong> Both scores provide complementary insights into liver health</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Medical Disclaimer */}
      <Card className="border-medical-warning-200 bg-medical-warning-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-medical-warning-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-medical-warning-800">
              <p className="font-medium mb-1">Medical Disclaimer</p>
              <p>
                These medical scoring tools are for educational and informational purposes only. 
                All scores should be interpreted by qualified healthcare professionals in the context of 
                complete clinical assessment. Do not use these tools for making medical decisions without 
                consulting your healthcare provider.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}