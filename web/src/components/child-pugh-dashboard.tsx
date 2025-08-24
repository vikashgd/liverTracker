"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calculator, Info, CheckCircle, XCircle, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  calculateChildPugh,
  type ChildPughParameters,
  type ChildPughResult 
} from '@/lib/meld-calculator';

interface ChildPughDashboardProps {
  initialValues?: {
    bilirubin?: number;
    albumin?: number;
    inr?: number;
    ascites?: 'none' | 'mild' | 'moderate';
    encephalopathy?: 'none' | 'grade1-2' | 'grade3-4';
  };
  onScoreCalculated?: (result: ChildPughResult) => void;
}

export function ChildPughDashboard({ initialValues, onScoreCalculated }: ChildPughDashboardProps) {
  // Form state
  const [formData, setFormData] = useState<ChildPughParameters>({
    bilirubin: initialValues?.bilirubin || 0,
    albumin: initialValues?.albumin || 0,
    inr: initialValues?.inr || 0,
    ascites: initialValues?.ascites || 'none',
    encephalopathy: initialValues?.encephalopathy || 'none'
  });

  // Results state
  const [childPughResult, setChildPughResult] = useState<ChildPughResult | null>(null);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  // Auto-calculate when form data changes
  useEffect(() => {
    if (formData.bilirubin > 0 && formData.albumin > 0 && formData.inr > 0) {
      const validationResult = validateChildPughParameters(formData);
      setValidation(validationResult);

      if (validationResult.isValid) {
        const result = calculateChildPugh(formData);
        setChildPughResult(result);
        onScoreCalculated?.(result);
        
        console.log('🫀 Child-Pugh Dashboard Calculation:', {
          input: formData,
          result: {
            score: result.score,
            class: result.class,
            interpretation: result.interpretation,
            oneYearSurvival: result.oneYearSurvival,
            twoYearSurvival: result.twoYearSurvival
          }
        });
      } else {
        setChildPughResult(null);
      }
    } else {
      setChildPughResult(null);
      setValidation(null);
    }
  }, [formData, onScoreCalculated]);

  const updateFormData = (field: keyof ChildPughParameters, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getClassColor = (childClass: string) => {
    switch (childClass) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'C': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSurvivalColor = (survival: string) => {
    const percentage = parseInt(survival);
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const validateChildPughParameters = (params: ChildPughParameters) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required lab parameters
    if (!params.bilirubin || params.bilirubin <= 0) {
      errors.push('Serum Bilirubin is required and must be > 0 mg/dL');
    }
    if (!params.albumin || params.albumin <= 0) {
      errors.push('Serum Albumin is required and must be > 0 g/dL');
    }
    if (!params.inr || params.inr <= 0) {
      errors.push('INR is required and must be > 0');
    }

    // Check value ranges
    if (params.bilirubin && (params.bilirubin < 0.1 || params.bilirubin > 50)) {
      warnings.push(`Bilirubin ${params.bilirubin} mg/dL is outside typical range (0.1-50)`);
    }
    if (params.albumin && (params.albumin < 1.0 || params.albumin > 6.0)) {
      warnings.push(`Albumin ${params.albumin} g/dL is outside typical range (1.0-6.0)`);
    }
    if (params.inr && (params.inr < 0.8 || params.inr > 10)) {
      warnings.push(`INR ${params.inr} is outside typical range (0.8-10)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Heart className="w-6 h-6 text-red-600" />
        <h2 className="text-2xl font-bold text-medical-neutral-900">
          Child-Pugh Score Calculator
        </h2>
        <Badge variant="outline" className="text-xs">
          Liver Disease Severity
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Clinical Parameters</span>
              {validation?.isValid && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Valid
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Lab Parameters */}
            <div className="space-y-4">
              <h4 className="font-medium text-medical-neutral-900 border-b pb-2">
                Laboratory Values
              </h4>
              
              <div className="grid grid-cols-1 gap-4">
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
                  <div className="text-xs text-medical-neutral-500 mt-1">
                    Points: &lt;2.0 = 1pt, 2.0-3.0 = 2pts, &gt;3.0 = 3pts
                  </div>
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
                      onChange={(e) => updateFormData('albumin', parseFloat(e.target.value) || 0)}
                    />
                    <span className="flex items-center text-sm text-medical-neutral-600 whitespace-nowrap">
                      g/dL
                    </span>
                  </div>
                  <div className="text-xs text-medical-neutral-500 mt-1">
                    Points: &gt;3.5 = 1pt, 2.8-3.5 = 2pts, &lt;2.8 = 3pts
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
                  <div className="text-xs text-medical-neutral-500 mt-1">
                    Points: &lt;1.7 = 1pt, 1.7-2.3 = 2pts, &gt;2.3 = 3pts
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical Parameters */}
            <div className="space-y-4">
              <h4 className="font-medium text-medical-neutral-900 border-b pb-2">
                Clinical Assessment
              </h4>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="ascites">Ascites</Label>
                  <Select 
                    value={formData.ascites} 
                    onValueChange={(value) => updateFormData('ascites', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (1 point)</SelectItem>
                      <SelectItem value="mild">Mild/Controlled (2 points)</SelectItem>
                      <SelectItem value="moderate">Moderate/Refractory (3 points)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-medical-neutral-500 mt-1">
                    Fluid accumulation in abdomen
                  </p>
                </div>

                <div>
                  <Label htmlFor="encephalopathy">Hepatic Encephalopathy</Label>
                  <Select 
                    value={formData.encephalopathy} 
                    onValueChange={(value) => updateFormData('encephalopathy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (1 point)</SelectItem>
                      <SelectItem value="grade1-2">Grade 1-2/Controlled (2 points)</SelectItem>
                      <SelectItem value="grade3-4">Grade 3-4/Refractory (3 points)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-medical-neutral-500 mt-1">
                    Cognitive impairment due to liver dysfunction
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Child-Pugh Score Results</CardTitle>
          </CardHeader>
          <CardContent>
            {childPughResult ? (
              <div className="space-y-6">
                {/* Primary Score */}
                <div className="text-center">
                  <div className="text-6xl font-bold text-medical-neutral-800 mb-2">
                    {childPughResult.score}
                  </div>
                  <div className="text-lg text-medical-neutral-600 mb-4">
                    Total Score (out of 15)
                  </div>
                  <Badge className={`text-lg px-4 py-2 ${getClassColor(childPughResult.class)}`}>
                    Class {childPughResult.class}
                  </Badge>
                </div>

                {/* Clinical Interpretation */}
                <div className="p-4 border rounded-lg bg-medical-neutral-50">
                  <h4 className="font-medium text-medical-neutral-900 mb-2">Clinical Interpretation</h4>
                  <p className="text-sm text-medical-neutral-700 mb-3">
                    {childPughResult.interpretation}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-medical-neutral-800">1-Year Survival:</span>
                      <span className={`ml-2 font-bold ${getSurvivalColor(childPughResult.oneYearSurvival)}`}>
                        {childPughResult.oneYearSurvival}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-medical-neutral-800">2-Year Survival:</span>
                      <span className={`ml-2 font-bold ${getSurvivalColor(childPughResult.twoYearSurvival)}`}>
                        {childPughResult.twoYearSurvival}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="p-4 border rounded-lg bg-white">
                  <h4 className="font-medium text-medical-neutral-900 mb-3">Score Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Bilirubin ({formData.bilirubin} mg/dL):</span>
                      <span className="font-medium">
                        {formData.bilirubin < 2.0 ? '1' : formData.bilirubin <= 3.0 ? '2' : '3'} points
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Albumin ({formData.albumin} g/dL):</span>
                      <span className="font-medium">
                        {formData.albumin > 3.5 ? '1' : formData.albumin >= 2.8 ? '2' : '3'} points
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>INR ({formData.inr}):</span>
                      <span className="font-medium">
                        {formData.inr < 1.7 ? '1' : formData.inr <= 2.3 ? '2' : '3'} points
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ascites:</span>
                      <span className="font-medium">
                        {formData.ascites === 'none' ? '1' : formData.ascites === 'mild' ? '2' : '3'} points
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Encephalopathy:</span>
                      <span className="font-medium">
                        {formData.encephalopathy === 'none' ? '1' : formData.encephalopathy === 'grade1-2' ? '2' : '3'} points
                      </span>
                    </div>
                  </div>
                </div>

                {/* Class Information */}
                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Child-Pugh Classification</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div><strong>Class A (5-6 points):</strong> Well-compensated disease, good prognosis</div>
                    <div><strong>Class B (7-9 points):</strong> Moderately decompensated, intermediate prognosis</div>
                    <div><strong>Class C (10-15 points):</strong> Severely decompensated, poor prognosis</div>
                  </div>
                </div>

                {/* Validation Warnings */}
                {validation && validation.warnings.length > 0 && (
                  <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                    <h5 className="font-medium text-yellow-800 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Calculation Notes
                    </h5>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {validation.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-medical-neutral-500">
                <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Enter Clinical Data</p>
                <p className="text-sm">
                  Provide lab values and clinical assessment to calculate Child-Pugh score
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
                The Child-Pugh score is for educational and informational purposes only. 
                Clinical assessment of ascites and encephalopathy should be performed by qualified 
                healthcare professionals. This tool should not be used for making medical decisions 
                without consulting your healthcare provider.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}