'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  calculateChildPugh, 
  extractChildPughParameters, 
  validateChildPughData,
  type ChildPughParameters,
  type ChildPughResult 
} from '@/lib/child-pugh-calculator';
import { 
  calculateTransplantReadiness,
  type TransplantReadinessParameters,
  type TransplantReadinessResult 
} from '@/lib/transplant-readiness-calculator';
import {
  calculateComprehensiveLiverAssessment,
  extractLiverFunctionParameters,
  type LiverFunctionParameters,
  type ComprehensiveLiverAssessment
} from '@/lib/liver-function-calculators';

interface AdvancedMedicalDashboardProps {
  charts: any[];
  patientProfile?: {
    age?: number;
    gender?: 'male' | 'female';
    primaryDiagnosis?: string;
    [key: string]: any;
  };
}

interface ChildPughFormData {
  ascites: 'none' | 'slight' | 'moderate';
  encephalopathy: 'none' | 'grade1-2' | 'grade3-4';
}

interface TransplantFormData {
  age: number;
  primaryDiagnosis: 'hepatitis_c' | 'hepatitis_b' | 'alcoholic_liver_disease' | 'nash' | 'pbc' | 'psc' | 'autoimmune' | 'wilson' | 'hemochromatosis' | 'other';
  complications: {
    varicesWithBleeding: boolean;
    ascites: 'none' | 'controlled' | 'refractory';
    hepaticEncephalopathy: 'none' | 'episodic' | 'persistent';
    spontaneousBacterialPeritonitis: boolean;
    hepatocellularCarcinoma: boolean;
    hepatopulmonarySyndrome: boolean;
    portopulmonaryHypertension: boolean;
  };
  comorbidities: {
    cardiovascularDisease: 'none' | 'mild' | 'moderate' | 'severe';
    pulmonaryDisease: 'none' | 'mild' | 'moderate' | 'severe';
    renalDisease: 'none' | 'mild' | 'moderate' | 'severe';
    diabetes: boolean;
    osteoporosis: boolean;
    activeInfection: boolean;
    malignancy: 'none' | 'treated' | 'active';
  };
  psychosocial: {
    substanceAbuse: {
      alcohol: 'none' | 'past' | 'current';
      drugs: 'none' | 'past' | 'current';
      sobrietyDuration?: number;
    };
    socialSupport: 'excellent' | 'good' | 'fair' | 'poor';
    mentalHealth: 'stable' | 'mild_issues' | 'moderate_issues' | 'severe_issues';
    compliance: 'excellent' | 'good' | 'fair' | 'poor';
  };
  functionalStatus: {
    karnofskyScore?: number;
    ecogStatus?: 0 | 1 | 2 | 3 | 4;
    independentLiving: boolean;
  };
}

export default function AdvancedMedicalDashboard({ charts, patientProfile = {} }: AdvancedMedicalDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'child-pugh' | 'transplant' | 'fibrosis'>('overview');
  const [isClient, setIsClient] = useState(false);
  
  // Child-Pugh form state
  const [childPughForm, setChildPughForm] = useState<ChildPughFormData>({
    ascites: 'none',
    encephalopathy: 'none'
  });
  
  // Calculation state
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Transplant form state (with defaults)
  const [transplantForm, setTransplantForm] = useState<TransplantFormData>({
    age: patientProfile.age || 50,
    primaryDiagnosis: 'nash',
    complications: {
      varicesWithBleeding: false,
      ascites: 'none',
      hepaticEncephalopathy: 'none',
      spontaneousBacterialPeritonitis: false,
      hepatocellularCarcinoma: false,
      hepatopulmonarySyndrome: false,
      portopulmonaryHypertension: false
    },
    comorbidities: {
      cardiovascularDisease: 'none',
      pulmonaryDisease: 'none',
      renalDisease: 'none',
      diabetes: false,
      osteoporosis: false,
      activeInfection: false,
      malignancy: 'none'
    },
    psychosocial: {
      substanceAbuse: {
        alcohol: 'none',
        drugs: 'none'
      },
      socialSupport: 'good',
      mentalHealth: 'stable',
      compliance: 'good'
    },
    functionalStatus: {
      independentLiving: true
    }
  });

  useEffect(() => {
    console.log('🌐 Setting isClient to true');
    setIsClient(true);
  }, []);

  // Auto-clear only the "fresh calculation" badge after 5 seconds, but keep results visible
  const [showFreshBadge, setShowFreshBadge] = useState(false);
  
  useEffect(() => {
    if (showResults) {
      setShowFreshBadge(true);
      const timer = setTimeout(() => {
        setShowFreshBadge(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showResults]);

  // Calculate Child-Pugh score
  const childPughResult = useMemo(() => {
    console.log('🔄 Child-Pugh calculation useMemo triggered');
    console.log('isClient:', isClient, 'showResults:', showResults);
    
    if (!isClient) {
      console.log('❌ Calculation skipped: isClient =', isClient);
      return null;
    }
    
    if (!showResults) {
      console.log('❌ Calculation skipped: showResults =', showResults);
      return null;
    }
    
    const labParams = extractChildPughParameters(charts);
    
    // Add clinical assessments from form for validation
    const fullParams = {
      ...labParams,
      ascites: childPughForm.ascites,
      encephalopathy: childPughForm.encephalopathy
    };
    
    const validation = validateChildPughData(fullParams);
    
    console.log('📊 Lab params for calculation:', labParams);
    console.log('📋 Full params with clinical:', fullParams);
    console.log('✅ Validation result:', validation);
    
    if (!validation.canCalculate) {
      console.log('❌ Cannot calculate - missing data:', validation.missingLabs, validation.missingClinical);
      return null;
    }
    
    const calculationParams: ChildPughParameters = {
      bilirubin: labParams.bilirubin!,
      albumin: labParams.albumin!,
      inr: labParams.inr!,
      ascites: childPughForm.ascites,
      encephalopathy: childPughForm.encephalopathy
    };
    
    console.log('🧮 Calculation params:', calculationParams);
    
    try {
      const result = calculateChildPugh(calculationParams);
      console.log('✅ Child-Pugh calculation successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Child-Pugh calculation error:', error);
      return null;
    }
  }, [charts, childPughForm, isClient, showResults]);

  // Calculate liver function assessments
  const liverFunctionResult = useMemo(() => {
    if (!isClient) return null;
    
    const params = extractLiverFunctionParameters(charts, patientProfile.age, patientProfile.gender);
    return calculateComprehensiveLiverAssessment(params);
  }, [charts, patientProfile, isClient]);

  // Calculate transplant readiness
  const transplantResult = useMemo(() => {
    if (!isClient) return null;
    
    try {
      return calculateTransplantReadiness(transplantForm);
    } catch (error) {
      console.error('Transplant readiness calculation error:', error);
      return null;
    }
  }, [transplantForm, isClient]);

  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
        <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'child-pugh', name: 'Child-Pugh', icon: '🏥' },
    { id: 'transplant', name: 'Transplant Readiness', icon: '🫀' },
    { id: 'fibrosis', name: 'Fibrosis Assessment', icon: '🔬' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">🧪 Advanced Medical Calculators</h2>
        <p className="text-purple-100">
          Comprehensive liver function assessment tools for clinical decision-making
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Child-Pugh Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏥 Child-Pugh Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              {childPughResult ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{childPughResult.score}</div>
                    <div className="text-lg font-semibold">Class {childPughResult.class}</div>
                    <Badge className={
                      childPughResult.class === 'A' ? 'bg-green-100 text-green-800' :
                      childPughResult.class === 'B' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {childPughResult.interpretation.severity}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>{childPughResult.interpretation.mortality}</p>
                    <p>{childPughResult.interpretation.survival}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">Complete clinical assessment needed</p>
                  <button 
                    onClick={() => setActiveTab('child-pugh')}
                    className="mt-2 text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Complete Assessment →
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fibrosis Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔬 Fibrosis Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {liverFunctionResult ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <Badge className={
                      liverFunctionResult.summary.overallRisk === 'low' ? 'bg-green-100 text-green-800' :
                      liverFunctionResult.summary.overallRisk === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {liverFunctionResult.summary.overallRisk.toUpperCase()} RISK
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    {liverFunctionResult.fib4 && (
                      <div>FIB-4: <span className="font-medium">{liverFunctionResult.fib4.score}</span></div>
                    )}
                    {liverFunctionResult.apri && (
                      <div>APRI: <span className="font-medium">{liverFunctionResult.apri.score}</span></div>
                    )}
                    {liverFunctionResult.astAltRatio && (
                      <div>AST/ALT: <span className="font-medium">{liverFunctionResult.astAltRatio.ratio}</span></div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">Insufficient lab data</p>
                  <button 
                    onClick={() => setActiveTab('fibrosis')}
                    className="mt-2 text-purple-600 hover:text-purple-800 font-medium"
                  >
                    View Details →
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transplant Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🫀 Transplant Readiness
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transplantResult ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{transplantResult.score}/100</div>
                    <Badge className={
                      transplantResult.overallStatus === 'excellent_candidate' ? 'bg-green-100 text-green-800' :
                      transplantResult.overallStatus === 'good_candidate' ? 'bg-blue-100 text-blue-800' :
                      transplantResult.overallStatus === 'marginal_candidate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {transplantResult.overallStatus.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <Progress value={transplantResult.score} className="w-full" />
                  {transplantResult.contraindications.absolute.length > 0 && (
                    <div className="text-xs text-red-600">
                      ⚠️ {transplantResult.contraindications.absolute.length} absolute contraindication(s)
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">Assessment not completed</p>
                  <button 
                    onClick={() => setActiveTab('transplant')}
                    className="mt-2 text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Start Assessment →
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'child-pugh' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Child-Pugh Form */}
          <Card>
            <CardHeader>
              <CardTitle>Clinical Assessment Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ascites Assessment
                </label>
                <select 
                  value={childPughForm.ascites}
                  onChange={(e) => setChildPughForm(prev => ({ 
                    ...prev, 
                    ascites: e.target.value as 'none' | 'slight' | 'moderate' 
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="none">None</option>
                  <option value="slight">Slight (controlled with diuretics)</option>
                  <option value="moderate">Moderate (despite diuretics)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hepatic Encephalopathy (West Haven Criteria)
                </label>
                <select 
                  value={childPughForm.encephalopathy}
                  onChange={(e) => setChildPughForm(prev => ({ 
                    ...prev, 
                    encephalopathy: e.target.value as 'none' | 'grade1-2' | 'grade3-4' 
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="none">None</option>
                  <option value="grade1-2">Grade 1-2 (Mild-Moderate)</option>
                  <option value="grade3-4">Grade 3-4 (Severe)</option>
                </select>
              </div>

              {/* Lab Values Display */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Current Lab Values</h4>
                <div className="space-y-1 text-sm">
                  {(() => {
                    const labParams = extractChildPughParameters(charts);
                    const validation = validateChildPughData(labParams);
                    return (
                      <>
                        <div className="flex justify-between">
                          <span>Bilirubin:</span>
                          <span className={labParams.bilirubin ? 'text-green-600 font-medium' : 'text-red-500'}>
                            {labParams.bilirubin?.toFixed(1) || 'Missing'} {labParams.bilirubin ? 'mg/dL' : ''}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Albumin:</span>
                          <span className={labParams.albumin ? 'text-green-600 font-medium' : 'text-red-500'}>
                            {labParams.albumin?.toFixed(1) || 'Missing'} {labParams.albumin ? 'g/dL' : ''}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>INR:</span>
                          <span className={labParams.inr ? 'text-green-600 font-medium' : 'text-red-500'}>
                            {labParams.inr?.toFixed(1) || 'Missing'}
                          </span>
                        </div>
                        {validation.missingLabs.length > 0 && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
                            ⚠️ Missing lab values: {validation.missingLabs.join(', ')}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Submit/Calculate Button */}
              <div className="text-center">
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      try {
                        console.log('🧮 Calculate button clicked');
                        console.log('Current form state:', childPughForm);
                        
                        const labParams = extractChildPughParameters(charts);
                        
                        // Add clinical assessments from form
                        const fullParams = {
                          ...labParams,
                          ascites: childPughForm.ascites,
                          encephalopathy: childPughForm.encephalopathy
                        };
                        
                        console.log('Lab params:', labParams);
                        console.log('Full params with clinical:', fullParams);
                        console.log('Form ascites:', childPughForm.ascites, 'Type:', typeof childPughForm.ascites);
                        console.log('Form encephalopathy:', childPughForm.encephalopathy, 'Type:', typeof childPughForm.encephalopathy);
                        
                        const validation = validateChildPughData(fullParams);
                        console.log('Validation result:', validation);
                        
                        if (!validation.canCalculate) {
                          const missingItems = [...validation.missingLabs, ...validation.missingClinical];
                          console.log('❌ Validation failed:', validation);
                          alert('Cannot calculate Child-Pugh score:\n\nMissing: ' + missingItems.join(', ') + '\n\nPlease ensure all lab values are available and clinical assessments are complete.');
                          return;
                        }
                        
                        console.log('✅ Validation passed, proceeding with calculation');
                        
                        setIsCalculating(true);
                        console.log('Starting calculation...');
                        
                        // Use setTimeout instead of await to avoid async issues
                        setTimeout(() => {
                          setShowResults(true);
                          setIsCalculating(false);
                          console.log('✅ Calculation triggered, showResults set to true');
                        }, 500);
                        
                      } catch (error) {
                        console.error('❌ Error in button click handler:', error);
                        setIsCalculating(false);
                      }
                    }}
                    disabled={isCalculating}
                    className={`w-full py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl font-semibold ${
                      isCalculating 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                    }`}
                  >
                    {isCalculating ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Calculating...
                      </span>
                    ) : (
                      '🧮 Calculate Child-Pugh Score'
                    )}
                  </button>
                  
                  {showResults && (
                    <button
                      onClick={() => {
                        setChildPughForm({ ascites: 'none', encephalopathy: 'none' });
                        setShowResults(false);
                        setShowFreshBadge(false);
                      }}
                      className="w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors text-sm"
                    >
                      🔄 Reset Assessment
                    </button>
                  )}
                  
                  {/* Debug Test Button */}
                  <button
                    onClick={() => {
                      console.log('🧪 DEBUG: Force calculation test');
                      console.log('isClient:', isClient);
                      setIsClient(true);
                      setShowResults(true);
                      console.log('After forcing: isClient=true, showResults=true');
                    }}
                    className="w-full py-1 px-4 rounded-lg border border-yellow-300 text-yellow-600 hover:bg-yellow-50 transition-colors text-xs"
                  >
                    🧪 DEBUG: Force Show Results
                  </button>
                </div>
                {(() => {
                  const labParams = extractChildPughParameters(charts);
                  const fullParams = {
                    ...labParams,
                    ascites: childPughForm.ascites,
                    encephalopathy: childPughForm.encephalopathy
                  };
                  const validation = validateChildPughData(fullParams);
                  
                  return !validation.canCalculate ? (
                    <p className="text-xs text-red-500 mt-2">
                      ⚠️ Cannot calculate: Missing {[...validation.missingLabs, ...validation.missingClinical].join(', ')}
                    </p>
                  ) : (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ Ready to calculate with current data
                    </p>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Child-Pugh Results */}
          <Card className={showResults ? 'ring-2 ring-purple-300 shadow-lg' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Child-Pugh Score Results
                {showFreshBadge && (
                  <Badge className="bg-green-100 text-green-800 animate-pulse">
                    ✨ Fresh Calculation
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {childPughResult ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600">{childPughResult.score}</div>
                    <div className="text-xl font-semibold">Class {childPughResult.class}</div>
                    <Badge className={
                      childPughResult.class === 'A' ? 'bg-green-100 text-green-800' :
                      childPughResult.class === 'B' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {childPughResult.interpretation.severity}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-800">Parameter Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Bilirubin:</span>
                          <span>{childPughResult.breakdown.bilirubin.points} points</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Albumin:</span>
                          <span>{childPughResult.breakdown.albumin.points} points</span>
                        </div>
                        <div className="flex justify-between">
                          <span>INR:</span>
                          <span>{childPughResult.breakdown.inr.points} points</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ascites:</span>
                          <span>{childPughResult.breakdown.ascites.points} points</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Encephalopathy:</span>
                          <span>{childPughResult.breakdown.encephalopathy.points} points</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-800">Clinical Significance</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>{childPughResult.interpretation.mortality}</p>
                        <p>{childPughResult.interpretation.survival}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-800">Recommendations</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {childPughResult.interpretation.recommendations.map((rec, idx) => (
                          <li key={idx}>• {rec}</li>
                        ))}
                      </ul>
                    </div>

                    {childPughResult.warnings.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600">⚠️ Clinical Warnings</h4>
                        <ul className="space-y-1 text-sm text-red-600">
                          {childPughResult.warnings.map((warning, idx) => (
                            <li key={idx}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl">🏥</span>
                    </div>
                    <p className="text-gray-500 mb-2">Complete the clinical assessment to calculate Child-Pugh score</p>
                    <p className="text-xs text-gray-400">
                      Fill in ascites and encephalopathy assessments, then click calculate
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'fibrosis' && (
        <div className="space-y-6">
          {liverFunctionResult ? (
            <>
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle>🔬 Comprehensive Fibrosis Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {liverFunctionResult.fib4 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{liverFunctionResult.fib4.score}</div>
                        <div className="text-sm font-medium">FIB-4 Score</div>
                        <Badge className={
                          liverFunctionResult.fib4.interpretation === 'low_fibrosis' ? 'bg-green-100 text-green-800' :
                          liverFunctionResult.fib4.interpretation === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {liverFunctionResult.fib4.interpretation.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}

                    {liverFunctionResult.apri && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{liverFunctionResult.apri.score}</div>
                        <div className="text-sm font-medium">APRI Score</div>
                        <Badge className={
                          liverFunctionResult.apri.interpretation === 'low_fibrosis' ? 'bg-green-100 text-green-800' :
                          liverFunctionResult.apri.interpretation === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {liverFunctionResult.apri.interpretation.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}

                    {liverFunctionResult.astAltRatio && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{liverFunctionResult.astAltRatio.ratio}</div>
                        <div className="text-sm font-medium">AST/ALT Ratio</div>
                        <Badge className={
                          liverFunctionResult.astAltRatio.ratio < 1 ? 'bg-green-100 text-green-800' :
                          liverFunctionResult.astAltRatio.ratio < 2 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {liverFunctionResult.astAltRatio.ratio < 1 ? 'Normal' : 
                           liverFunctionResult.astAltRatio.ratio < 2 ? 'Concerning' : 'High Risk'}
                        </Badge>
                      </div>
                    )}

                    <div className="text-center">
                      <Badge className={
                        liverFunctionResult.summary.overallRisk === 'low' ? 'bg-green-100 text-green-800' :
                        liverFunctionResult.summary.overallRisk === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {liverFunctionResult.summary.overallRisk.toUpperCase()} RISK
                      </Badge>
                      <div className="text-sm font-medium mt-2">Overall Assessment</div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-800">Key Findings</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {liverFunctionResult.summary.keyFindings.map((finding, idx) => (
                          <li key={idx}>• {finding}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-800">Recommendations</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {liverFunctionResult.summary.recommendations.map((rec, idx) => (
                          <li key={idx}>• {rec}</li>
                        ))}
                      </ul>
                    </div>

                    {liverFunctionResult.summary.conflictingResults.length > 0 && (
                      <div>
                        <h4 className="font-medium text-orange-600">⚠️ Conflicting Results</h4>
                        <ul className="space-y-1 text-sm text-orange-600">
                          {liverFunctionResult.summary.conflictingResults.map((conflict, idx) => (
                            <li key={idx}>• {conflict}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Results Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {liverFunctionResult.fib4 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>FIB-4 Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">{liverFunctionResult.fib4.score}</div>
                          <Badge className={
                            liverFunctionResult.fib4.interpretation === 'low_fibrosis' ? 'bg-green-100 text-green-800' :
                            liverFunctionResult.fib4.interpretation === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {liverFunctionResult.fib4.interpretation.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>{liverFunctionResult.fib4.fibrosisProbability}</p>
                          <p className="mt-2 font-medium">{liverFunctionResult.fib4.recommendation}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {liverFunctionResult.apri && (
                  <Card>
                    <CardHeader>
                      <CardTitle>APRI Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">{liverFunctionResult.apri.score}</div>
                          <Badge className={
                            liverFunctionResult.apri.interpretation === 'low_fibrosis' ? 'bg-green-100 text-green-800' :
                            liverFunctionResult.apri.interpretation === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {liverFunctionResult.apri.interpretation.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>{liverFunctionResult.apri.cirrhosisRisk}</p>
                          <p className="mt-2 font-medium">{liverFunctionResult.apri.recommendation}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Insufficient laboratory data for fibrosis assessment</p>
                <p className="text-sm text-gray-400 mt-2">Required: AST, ALT, Platelets</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'transplant' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>🫀 Liver Transplant Readiness Assessment</CardTitle>
              <p className="text-sm text-gray-600">
                This assessment evaluates transplant candidacy based on medical, psychosocial, and functional criteria
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-gray-500">
                  Full transplant readiness assessment requires detailed clinical evaluation
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  This feature would include comprehensive forms for:
                </p>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div>• Medical history and complications</div>
                  <div>• Comorbidity assessment</div>
                  <div>• Psychosocial evaluation</div>
                  <div>• Functional status assessment</div>
                  <div>• Substance abuse screening</div>
                </div>
                
                {transplantResult && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{transplantResult.score}/100</div>
                    <Badge className="mt-2">
                      {transplantResult.overallStatus.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
