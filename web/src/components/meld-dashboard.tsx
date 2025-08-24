"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calculator, Info, CheckCircle, XCircle } from 'lucide-react';
import { 
  calculateMELD, 
  validateMELDParameters,
  type MELDParameters,
  type MELDResult 
} from '@/lib/meld-calculator';

interface MELDDashboardProps {
  initialValues?: {
    bilirubin?: number;
    creatinine?: number;
    inr?: number;
    sodium?: number;
    albumin?: number;
    profileData?: {
      gender?: 'male' | 'female';
      onDialysis: boolean;
      dialysisSessionsPerWeek?: number;
      dialysisType?: string;
    };
  };
  onScoreCalculated?: (result: MELDResult) => void;
  hideManualInputs?: boolean;
  autoCalculate?: boolean;
}

export function MELDDashboard({ initialValues, onScoreCalculated, hideManualInputs = false, autoCalculate = false }: MELDDashboardProps) {
  // Form state
  const [formData, setFormData] = useState<MELDParameters>({
    bilirubin: initialValues?.bilirubin || 0,
    creatinine: initialValues?.creatinine || 0,
    inr: initialValues?.inr || 0,
    sodium: initialValues?.sodium,
    albumin: initialValues?.albumin,
    gender: initialValues?.profileData?.gender,
    dialysis: {
      onDialysis: initialValues?.profileData?.onDialysis || false,
      sessionsPerWeek: initialValues?.profileData?.dialysisSessionsPerWeek || 0
    }
  });

  // Results state
  const [meldResult, setMeldResult] = useState<MELDResult | null>(null);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  } | null>(null);

  // Update form data when initialValues change
  useEffect(() => {
    if (initialValues) {
      setFormData({
        bilirubin: initialValues.bilirubin || 0,
        creatinine: initialValues.creatinine || 0,
        inr: initialValues.inr || 0,
        sodium: initialValues.sodium,
        albumin: initialValues.albumin,
        gender: initialValues.profileData?.gender,
        dialysis: {
          onDialysis: initialValues.profileData?.onDialysis || false,
          sessionsPerWeek: initialValues.profileData?.dialysisSessionsPerWeek || 0
        }
      });
    }
  }, [initialValues]);

  // Auto-calculate when form data changes
  useEffect(() => {
    if (formData.bilirubin > 0 && formData.creatinine > 0 && formData.inr > 0) {
      const validationResult = validateMELDParameters(formData);
      setValidation(validationResult);

      if (validationResult.isValid) {
        const result = calculateMELD(formData);
        setMeldResult(result);
        onScoreCalculated?.(result);
        
        console.log('🧮 MELD Dashboard Calculation:', {
          input: formData,
          result: {
            meld: result.meld,
            meldNa: result.meldNa,
            meld3: result.meld3,
            urgency: result.urgency,
            confidence: result.confidence
          },
          autoCalculate: autoCalculate
        });
      } else {
        setMeldResult(null);
      }
    } else {
      setMeldResult(null);
      setValidation(null);
    }
  }, [formData, onScoreCalculated, autoCalculate]);

  const updateFormData = (field: keyof MELDParameters, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateDialysis = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      dialysis: {
        ...prev.dialysis!,
        [field]: value
      }
    }));
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'low': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Calculator className="w-6 h-6 text-medical-primary-600" />
        <h2 className="text-2xl font-bold text-medical-neutral-900">
          MELD Score Calculator
        </h2>
        <Badge variant="outline" className="text-xs">
          MELD 3.0 Compatible
        </Badge>
      </div>

      <div className={`grid grid-cols-1 ${hideManualInputs ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-6`}>
        {/* Input Form - Hidden when hideManualInputs is true */}
        {!hideManualInputs && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Lab Values</span>
              {validation?.isValid && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Valid
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Required Parameters */}
            <div className="space-y-4">
              <h4 className="font-medium text-medical-neutral-900 border-b pb-2">
                Required Parameters
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bilirubin">Serum Bilirubin</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="bilirubin"
                      type="number"
                      step="0.1"
                      placeholder="1.2"
                      value={formData.bilirubin || ''}
                      onChange={(e) => updateFormData('bilirubin', parseFloat(e.target.value) || 0)}
                    />
                    <span className="flex items-center text-sm text-medical-neutral-600 whitespace-nowrap">
                      mg/dL
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="creatinine">Serum Creatinine</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="creatinine"
                      type="number"
                      step="0.1"
                      placeholder="1.0"
                      value={formData.creatinine || ''}
                      onChange={(e) => updateFormData('creatinine', parseFloat(e.target.value) || 0)}
                    />
                    <span className="flex items-center text-sm text-medical-neutral-600 whitespace-nowrap">
                      mg/dL
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="inr">INR</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="inr"
                      type="number"
                      step="0.1"
                      placeholder="1.1"
                      value={formData.inr || ''}
                      onChange={(e) => updateFormData('inr', parseFloat(e.target.value) || 0)}
                    />
                    <span className="flex items-center text-sm text-medical-neutral-600 whitespace-nowrap">
                      ratio
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Parameters */}
            <div className="space-y-4">
              <h4 className="font-medium text-medical-neutral-900 border-b pb-2">
                Optional Parameters (for enhanced accuracy)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sodium">Serum Sodium</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="sodium"
                      type="number"
                      step="1"
                      placeholder="140"
                      value={formData.sodium || ''}
                      onChange={(e) => updateFormData('sodium', parseFloat(e.target.value) || undefined)}
                    />
                    <span className="flex items-center text-sm text-medical-neutral-600 whitespace-nowrap">
                      mEq/L
                    </span>
                  </div>
                  <p className="text-xs text-medical-neutral-500 mt-1">For MELD-Na calculation</p>
                </div>

                <div>
                  <Label htmlFor="albumin">Serum Albumin</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="albumin"
                      type="number"
                      step="0.1"
                      placeholder="4.0"
                      value={formData.albumin || ''}
                      onChange={(e) => updateFormData('albumin', parseFloat(e.target.value) || undefined)}
                    />
                    <span className="flex items-center text-sm text-medical-neutral-600 whitespace-nowrap">
                      g/dL
                    </span>
                  </div>
                  <p className="text-xs text-medical-neutral-500 mt-1">For MELD 3.0 calculation</p>
                </div>
              </div>
            </div>

            {/* Clinical Parameters */}
            <div className="space-y-4">
              <h4 className="font-medium text-medical-neutral-900 border-b pb-2">
                Clinical Information (MELD 3.0)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">Patient Gender</Label>
                  <Select 
                    value={formData.gender || ''} 
                    onValueChange={(value) => updateFormData('gender', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-medical-neutral-500 mt-1">Required for MELD 3.0</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dialysis"
                      checked={formData.dialysis?.onDialysis || false}
                      onCheckedChange={(checked) => updateDialysis('onDialysis', checked)}
                    />
                    <Label htmlFor="dialysis">Patient on Dialysis</Label>
                  </div>
                  
                  {formData.dialysis?.onDialysis && (
                    <div>
                      <Label htmlFor="sessions">Sessions per week</Label>
                      <Input
                        id="sessions"
                        type="number"
                        min="0"
                        max="7"
                        value={formData.dialysis.sessionsPerWeek}
                        onChange={(e) => updateDialysis('sessionsPerWeek', parseInt(e.target.value) || 0)}
                      />
                      <p className="text-xs text-medical-neutral-500 mt-1">
                        ≥2 sessions/week: Creatinine adjusted to 4.0 mg/dL
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>MELD Score Results</CardTitle>
          </CardHeader>
          <CardContent>
            {meldResult ? (
              <div className="space-y-4">
                {/* Primary Scores */}
                <div className="grid grid-cols-1 gap-4">
                  {/* MELD 3.0 (if available) */}
                  {meldResult.meld3 && (
                    <div className="p-4 border rounded-lg bg-medical-primary-50 border-medical-primary-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-medical-primary-900">MELD 3.0 Score</h3>
                          <p className="text-xs text-medical-primary-700">Current Standard (2023)</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-medical-primary-900">
                            {meldResult.meld3}
                          </div>
                          <Badge className={getUrgencyColor(meldResult.urgency)}>
                            {meldResult.urgency}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MELD-Na */}
                  {meldResult.meldNa && (
                    <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-blue-900">MELD-Na Score</h3>
                          <p className="text-xs text-blue-700">With Sodium Adjustment</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-900">
                            {meldResult.meldNa}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Standard MELD */}
                  <div className="p-4 border rounded-lg bg-gray-50 border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Standard MELD</h3>
                        <p className="text-xs text-gray-700">Original Formula</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {meldResult.meld}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clinical Interpretation */}
                <div className="p-4 border rounded-lg bg-medical-neutral-50">
                  <h4 className="font-medium text-medical-neutral-900 mb-2">Clinical Interpretation</h4>
                  <p className="text-sm text-medical-neutral-700 mb-2">
                    {meldResult.interpretation}
                  </p>
                  <p className="text-sm font-medium text-medical-neutral-800">
                    {meldResult.transplantPriority}
                  </p>
                </div>

                {/* Calculation Confidence */}
                <div className="flex items-center space-x-2 p-3 border rounded-lg bg-white">
                  {getConfidenceIcon(meldResult.confidence)}
                  <span className="text-sm font-medium">
                    Calculation Confidence: {meldResult.confidence.charAt(0).toUpperCase() + meldResult.confidence.slice(1)}
                  </span>
                </div>

                {/* Warnings */}
                {meldResult.warnings.length > 0 && (
                  <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                    <h5 className="font-medium text-yellow-800 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Calculation Notes
                    </h5>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {meldResult.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Parameters */}
                {meldResult.missingParameters.length > 0 && (
                  <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                    <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                      <Info className="w-4 h-4 mr-2" />
                      For More Accurate Results
                    </h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {meldResult.missingParameters.map((param, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{param}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-medical-neutral-500">
                <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Enter Lab Values</p>
                <p className="text-sm">
                  Provide Bilirubin, Creatinine, and INR to calculate MELD score
                </p>
                
                {validation && !validation.isValid && (
                  <div className="mt-4 p-3 border rounded-lg bg-red-50 border-red-200 text-left">
                    <h5 className="font-medium text-red-800 mb-2">Validation Errors</h5>
                    <ul className="text-sm text-red-700 space-y-1">
                      {validation.errors.map((error, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Medical Disclaimer */}
      <Card className="border-medical-warning-200 bg-medical-warning-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-medical-warning-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-medical-warning-800">
              <p className="font-medium mb-1">Medical Disclaimer</p>
              <p>
                This MELD calculator is for educational and informational purposes only. 
                MELD scores should be interpreted by qualified healthcare professionals in the context of 
                complete clinical assessment. Do not use this tool for making medical decisions without 
                consulting your healthcare provider.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}