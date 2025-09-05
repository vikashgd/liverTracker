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
        if (data.profile) {
          setProfileData(data.profile);
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
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header - Dashboard Style */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Medical Scoring</h1>
                <p className="text-gray-600 mt-1">
                  MELD and Child-Pugh liver disease assessment
                </p>
              </div>
            </div>
            
            {overallRisk && (
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">Overall Risk</div>
                <div className={`text-xl font-semibold ${overallRisk.riskColor}`}>
                  {overallRisk.riskLevel}
                </div>
              </div>
            )}
          </div>

          {/* Profile Status - Inline with Header */}
          {!profileLoading && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Profile Integration</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    getProfileCompleteness() >= 100 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {getProfileCompleteness()}% Complete
                  </span>
                </div>
                
                {!profileData && (
                  <Link 
                    href="/profile" 
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Create Profile →
                  </Link>
                )}
              </div>
              
              {profileData && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Gender:</span>
                    <span className="ml-2 font-medium">
                      {profileData.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1) : 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Dialysis:</span>
                    <span className="ml-2 font-medium">
                      {profileData.onDialysis ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Disease:</span>
                    <span className="ml-2 font-medium">
                      {profileData.liverDiseaseType ? profileData.liverDiseaseType.replace('_', ' ') : 'Not set'}
                    </span>
                  </div>
                  {getProfileCompleteness() < 100 && (
                    <div>
                      <Link href="/profile" className="text-blue-600 hover:text-blue-700 text-sm">
                        Complete Profile →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Risk Assessment - Only show if we have results */}
        {overallRisk && (
          <div className="mb-8 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Risk Assessment</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${overallRisk.riskColor} bg-gray-100`}>
                  {overallRisk.riskLevel} Risk
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                {meldResult && `MELD: ${meldResult.meld3 || meldResult.meldNa || meldResult.meld}`}
                {meldResult && childPughResult && ' • '}
                {childPughResult && `Child-Pugh: Class ${childPughResult.class}`}
              </div>
            </div>
            
            {overallRisk.recommendations.length > 0 && (
              <div className="mt-3 text-sm text-gray-700">
                {overallRisk.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scoring Calculators - Clean Tabs */}
        <div className="bg-white rounded-lg border border-gray-200">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-200">
              <TabsList className="w-full bg-transparent border-none rounded-none h-auto p-0">
                <TabsTrigger 
                  value="meld" 
                  className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent py-4 px-6"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  MELD Score
                </TabsTrigger>
                <TabsTrigger 
                  value="child-pugh" 
                  className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent py-4 px-6"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Child-Pugh Score
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="meld" className="p-6 mt-0">
              <EnhancedMELDDashboard initialValues={initialValues} />
            </TabsContent>

            <TabsContent value="child-pugh" className="p-6 mt-0">
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
        </div>

        {/* Footer Information - Minimal */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">About These Scores</span>
            </div>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>MELD:</strong> Predicts 3-month mortality risk</p>
              <p><strong>Child-Pugh:</strong> Assesses liver disease severity</p>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-yellow-900">Medical Disclaimer</span>
            </div>
            <p className="text-sm text-yellow-800">
              For educational purposes only. Consult healthcare professionals for medical decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}