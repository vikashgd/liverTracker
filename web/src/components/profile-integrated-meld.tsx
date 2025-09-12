/**
 * Profile-Integrated MELD Calculator
 * 
 * MELD calculator that automatically uses profile data from the current session
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile, useProfileForScoring } from '@/hooks/use-profile';
import { Calculator, User, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface MELDCalculation {
  score: number;
  category: 'Low' | 'Medium' | 'High' | 'Very High';
  mortalityRisk: string;
  transplantPriority: string;
}

export function ProfileIntegratedMELD() {
  const { profile, medicalData, isLoading, error, hasRequiredData } = useProfileForScoring();
  const { refreshProfile } = useProfile();
  
  // Lab values for MELD calculation
  const [bilirubin, setBilirubin] = useState<number | ''>('');
  const [creatinine, setCreatinine] = useState<number | ''>('');
  const [inr, setINR] = useState<number | ''>('');
  const [sodium, setSodium] = useState<number | ''>('');
  
  // Calculation results
  const [meldScore, setMeldScore] = useState<MELDCalculation | null>(null);
  const [showCalculation, setShowCalculation] = useState(false);

  // Calculate MELD score
  const calculateMELD = () => {
    if (!bilirubin || !creatinine || !inr) {
      return;
    }

    // MELD 3.0 calculation
    const bili = Math.max(1.0, Number(bilirubin));
    const creat = Math.max(1.0, Number(creatinine));
    const inrVal = Math.max(1.0, Number(inr));
    const na = sodium ? Math.min(137, Math.max(125, Number(sodium))) : 137;

    // Apply dialysis adjustment
    const dialysisAdjustedCreat = medicalData?.onDialysis ? Math.max(4.0, creat) : creat;

    // MELD 3.0 formula
    let score = (
      0.957 * Math.log(dialysisAdjustedCreat) +
      0.378 * Math.log(bili) +
      1.120 * Math.log(inrVal) +
      0.643
    ) * 10;

    // Sodium adjustment for MELD-Na
    if (sodium && Number(sodium) < 137) {
      score = score + 1.32 * (137 - Number(sodium)) - (0.033 * score * (137 - Number(sodium)));
    }

    // Round and cap at 40
    score = Math.min(40, Math.max(6, Math.round(score)));

    // Determine category and risk
    let category: 'Low' | 'Medium' | 'High' | 'Very High';
    let mortalityRisk: string;
    let transplantPriority: string;

    if (score < 15) {
      category = 'Low';
      mortalityRisk = '< 5% (3 months)';
      transplantPriority = 'Lower priority';
    } else if (score < 25) {
      category = 'Medium';
      mortalityRisk = '5-15% (3 months)';
      transplantPriority = 'Medium priority';
    } else if (score < 35) {
      category = 'High';
      mortalityRisk = '15-30% (3 months)';
      transplantPriority = 'High priority';
    } else {
      category = 'Very High';
      mortalityRisk = '> 30% (3 months)';
      transplantPriority = 'Urgent priority';
    }

    setMeldScore({
      score,
      category,
      mortalityRisk,
      transplantPriority
    });
    setShowCalculation(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <span>Loading profile data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Integration Status */}
      <Card className={`${hasRequiredData ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <CardHeader className="pb-3">
          <CardTitle className={`flex items-center gap-2 ${hasRequiredData ? 'text-green-800' : 'text-yellow-800'}`}>
            <User className="h-5 w-5" />
            Profile Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasRequiredData ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">Profile data available for MELD calculation</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Age</p>
                  <p className="text-gray-600">{medicalData?.age || 'N/A'} years</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Gender</p>
                  <p className="text-gray-600 capitalize">{medicalData?.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Dialysis Status</p>
                  <Badge variant={medicalData?.onDialysis ? 'destructive' : 'secondary'}>
                    {medicalData?.onDialysis ? 'On Dialysis' : 'Not on Dialysis'}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Units</p>
                  <p className="text-gray-600">{medicalData?.preferredUnits || 'US'}</p>
                </div>
              </div>

              {medicalData?.onDialysis && (
                <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Dialysis Adjustment:</strong> Creatinine will be automatically adjusted to ≥4.0 mg/dL for MELD calculation
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-700">Profile data incomplete</span>
              </div>
              <p className="text-sm text-yellow-600">
                Complete your profile to enable automatic integration with MELD calculations.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshProfile}
                className="text-yellow-700 border-yellow-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MELD Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            MELD Score Calculator
            {hasRequiredData && (
              <Badge variant="default" className="ml-2">Profile-Integrated</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lab Values Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="bilirubin">Total Bilirubin (mg/dL)</Label>
              <Input
                id="bilirubin"
                type="number"
                step="0.1"
                min="0.1"
                value={bilirubin}
                onChange={(e) => setBilirubin(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g., 2.5"
              />
            </div>
            
            <div>
              <Label htmlFor="creatinine">Creatinine (mg/dL)</Label>
              <Input
                id="creatinine"
                type="number"
                step="0.1"
                min="0.1"
                value={creatinine}
                onChange={(e) => setCreatinine(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g., 1.2"
              />
              {medicalData?.onDialysis && (
                <p className="text-xs text-blue-600 mt-1">Will be adjusted to ≥4.0 for dialysis</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="inr">INR</Label>
              <Input
                id="inr"
                type="number"
                step="0.1"
                min="0.1"
                value={inr}
                onChange={(e) => setINR(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g., 1.5"
              />
            </div>
            
            <div>
              <Label htmlFor="sodium">Sodium (mEq/L) - Optional</Label>
              <Input
                id="sodium"
                type="number"
                min="120"
                max="150"
                value={sodium}
                onChange={(e) => setSodium(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g., 135"
              />
            </div>
          </div>

          <Button 
            onClick={calculateMELD}
            disabled={!bilirubin || !creatinine || !inr}
            className="w-full"
          >
            Calculate MELD Score
          </Button>

          {/* Results */}
          {showCalculation && meldScore && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-center">
                  MELD Score: {meldScore.score}
                  <Badge 
                    variant={
                      meldScore.category === 'Low' ? 'secondary' :
                      meldScore.category === 'Medium' ? 'default' :
                      meldScore.category === 'High' ? 'destructive' : 'destructive'
                    }
                    className="ml-2"
                  >
                    {meldScore.category} Risk
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-700">3-Month Mortality Risk</p>
                    <p className="text-gray-600">{meldScore.mortalityRisk}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Transplant Priority</p>
                    <p className="text-gray-600">{meldScore.transplantPriority}</p>
                  </div>
                </div>

                {hasRequiredData && (
                  <div className="mt-4 p-3 bg-green-100 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Profile Integration:</strong> This calculation used your profile data including 
                      dialysis status{medicalData?.onDialysis ? ' (creatinine adjusted)' : ''} and preferred units.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}