"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { type CanonicalMetric } from "@/lib/metrics";
import { UnifiedMedicalEngine, UNIFIED_MEDICAL_PARAMETERS } from "@/lib/unified-medical-engine";
import { calculateMELD, extractMELDParameters, type MELDResult } from "@/lib/meld-calculator";

interface SimpleLabData {
  // MELD Score Components (Priority 1)
  bilirubin?: { value: string; unit: string };
  creatinine?: { value: string; unit: string };
  inr?: { value: string; unit: string };
  
  // Core Liver Function (Priority 2)
  alt?: { value: string; unit: string };
  ast?: { value: string; unit: string };
  albumin?: { value: string; unit: string };
  platelets?: { value: string; unit: string };
  
  // Additional Tests (Priority 3)
  alp?: { value: string; unit: string };
  ggt?: { value: string; unit: string };
  totalProtein?: { value: string; unit: string };
  sodium?: { value: string; unit: string };
  potassium?: { value: string; unit: string };
}

export function SimpleLabEntry() {
  const [labData, setLabData] = useState<SimpleLabData>({});
  const [reportDate, setReportDate] = useState<string>("");
  const [reportType, setReportType] = useState<string>("Manual Lab Entry");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meldResult, setMeldResult] = useState<MELDResult | null>(null);

  // Initialize date on client side to avoid hydration mismatch
  useEffect(() => {
    if (!reportDate) {
      setReportDate(new Date().toISOString().split('T')[0]);
    }
  }, [reportDate]);

  // Generate lab parameters from unified engine definitions
  const labParameters = Object.entries(UNIFIED_MEDICAL_PARAMETERS).map(([metricKey, parameter]) => {
    const icons = {
      'Bilirubin': '🟡', 'Creatinine': '🔴', 'INR': '🩸', 'ALT': '🧪', 'AST': '🧪',
      'Albumin': '🔵', 'Platelets': '🩸', 'ALP': '⚗️', 'GGT': '🔬', 'TotalProtein': '🟢',
      'Sodium': '🧂', 'Potassium': '🍌'
    };
    
    return {
      key: metricKey.toLowerCase(),
      name: metricKey as CanonicalMetric,
      displayName: parameter.displayName,
      icon: icons[metricKey as keyof typeof icons] || '🧪',
      category: parameter.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      priority: parameter.priority,
      parameter // Include full parameter definition
    };
  }).sort((a, b) => a.priority - b.priority);

  const updateLabValue = (key: string, field: 'value' | 'unit', value: string) => {
    setLabData(prev => ({
      ...prev,
      [key]: {
        ...prev[key as keyof SimpleLabData],
        [field]: value
      }
    }));

    // Calculate MELD score whenever relevant values change
    calculateMELDScore();
  };

  const calculateMELDScore = () => {
    // Convert current form data to the format expected by MELD calculator
    const entries = Object.entries(labData).map(([key, data]) => {
      const param = labParameters.find(p => p.key === key);
      if (!param || !data?.value || isNaN(parseFloat(data.value))) return null;
      
      return {
        name: param.name,
        value: data.value,
        unit: data.unit || param.parameter.standardUnit || ""
      };
    }).filter(Boolean) as Array<{ name: CanonicalMetric; value: string; unit: string }>;

    if (entries.length > 0) {
      const meldParams = extractMELDParameters(entries);
      if (meldParams && meldParams.bilirubin !== null && meldParams.creatinine !== null && meldParams.inr !== null) {
        const result = calculateMELD(meldParams);
        setMeldResult(result);
      } else {
        setMeldResult(null);
      }
    }
  };

  const saveLabResults = async () => {
    // Validate that at least one value is entered
    const hasValues = Object.values(labData).some(data => data?.value && !isNaN(parseFloat(data.value)));
    
    if (!hasValues) {
      setError("Please enter at least one lab value");
      return;
    }

    if (!reportDate) {
      setError("Please select a report date");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Convert form data to API format
      const metricsAll = Object.entries(labData)
        .filter(([_, data]) => data?.value && !isNaN(parseFloat(data.value)))
        .map(([key, data]) => {
          const param = labParameters.find(p => p.key === key);
          return {
            name: param!.name,
            value: parseFloat(data!.value),
            unit: data!.unit || param!.parameter.standardUnit || null,
            category: "Manual Entry"
          };
        });

      const extractedData = {
        reportType,
        reportDate,
        metricsAll
      };

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectKey: `manual/${Date.now()}-simple-entry`,
          contentType: "application/json",
          extracted: extractedData,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Save failed: ${errorText}`);
      }

      const result = await response.json();
      setSavedId(result.id);
      
      // Don't reset form - just show success
      setError(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save lab results");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setLabData({});
    setSavedId(null);
    setError(null);
    setMeldResult(null);
    setReportDate(new Date().toISOString().split('T')[0]);
    setReportType("Manual Lab Entry");
  };

  // Group parameters by category for better organization
  const groupedParams = labParameters.reduce((acc, param) => {
    if (!acc[param.category]) acc[param.category] = [];
    acc[param.category].push(param);
    return acc;
  }, {} as Record<string, typeof labParameters>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-medical-neutral-900 mb-2">
          📝 Simple Lab Entry
        </h2>
        <p className="text-medical-neutral-600">
          Enter your lab values in one form. All fields are optional - fill only what you have.
        </p>
      </div>

      {/* Success Message */}
      {savedId && (
        <div className="medical-card p-4 bg-medical-success-50 border-medical-success-200">
          <div className="flex items-center space-x-2">
            <span className="text-medical-success-600">✅</span>
            <div>
              <p className="text-medical-success-800 font-medium">Lab results saved successfully!</p>
              <p className="text-medical-success-600 text-sm">
                You can view them in your dashboard and reports.
              </p>
            </div>
          </div>
          <Button 
            onClick={resetForm}
            className="mt-3 bg-medical-success-600 hover:bg-medical-success-700 text-white"
          >
            Enter New Results
          </Button>
        </div>
      )}

      {error && (
        <div className="medical-card p-4 bg-medical-error-50 border-medical-error-200">
          <p className="text-medical-error-800">{error}</p>
        </div>
      )}

      {!savedId && (
        <div className="space-y-6">
          {/* Report Information */}
          <div className="medical-card p-6">
            <h3 className="text-lg font-semibold text-medical-neutral-900 mb-4">
              📅 Report Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-medical-neutral-700 mb-2">
                  Report Date *
                </label>
                <Input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-medical-neutral-700 mb-2">
                  Report Type
                </label>
                <Input
                  type="text"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  placeholder="e.g., Routine Lab Work"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Lab Values Form */}
          {Object.entries(groupedParams).map(([category, params]) => (
            <div key={category} className="medical-card p-6">
              <h3 className="text-lg font-semibold text-medical-neutral-900 mb-4">
                {category === "MELD Score" && "🏥"} 
                {category === "Liver Function" && "🧪"} 
                {category === "Protein" && "🔵"} 
                {category === "Blood Count" && "🩸"} 
                {category === "Electrolytes" && "🧂"} 
                {category}
                {category === "MELD Score" && (
                  <span className="ml-2 text-sm font-normal text-medical-neutral-600">
                    (Required for liver disease assessment)
                  </span>
                )}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {params.map((param) => {
                  const currentData = labData[param.key as keyof SimpleLabData];
                  
                  return (
                    <div key={param.key} className="space-y-2">
                      <label className="block text-sm font-medium text-medical-neutral-700">
                        {param.icon} {param.displayName}
                        <span className="ml-1 text-xs text-medical-neutral-500">
                          (Normal: {param.parameter.normalRange.min}-{param.parameter.normalRange.max} {param.parameter.standardUnit})
                        </span>
                      </label>
                      
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          step="any"
                          value={currentData?.value || ""}
                          onChange={(e) => updateLabValue(param.key, 'value', e.target.value)}
                          placeholder="Value"
                          className="flex-1"
                        />
                        
                        <Select
                          value={currentData?.unit || param.parameter.standardUnit || ""}
                          onValueChange={(value) => updateLabValue(param.key, 'unit', value)}
                          placeholder="Unit"
                          options={Object.entries(param.parameter.unitSystem).map(([unit, info]) => ({
                            value: unit,
                            label: unit || 'dimensionless',
                            description: info.description || `${info.region} standard`,
                            isStandard: info.isStandard
                          }))}
                          className="w-24"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* MELD Score Display */}
          {meldResult && (
            <div className="medical-card p-6">
              <h3 className="text-lg font-semibold text-medical-neutral-900 mb-4 flex items-center">
                🏥 Liver Disease Assessment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-medical-neutral-700">MELD Score</span>
                    <span className={`text-2xl font-bold ${
                      meldResult.urgency === 'Critical' ? 'text-red-600' :
                      meldResult.urgency === 'High' ? 'text-orange-600' :
                      meldResult.urgency === 'Medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {meldResult.meld}
                    </span>
                  </div>
                  {meldResult.meldNa && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-medical-neutral-700">MELD-Na Score</span>
                      <span className={`text-xl font-bold ${
                        meldResult.urgency === 'Critical' ? 'text-red-600' :
                        meldResult.urgency === 'High' ? 'text-orange-600' :
                        meldResult.urgency === 'Medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {meldResult.meldNa}
                      </span>
                    </div>
                  )}
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    meldResult.urgency === 'Critical' ? 'bg-red-100 text-red-800' :
                    meldResult.urgency === 'High' ? 'bg-orange-100 text-orange-800' :
                    meldResult.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {meldResult.urgency} Priority
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-medical-neutral-700 mb-1">Clinical Interpretation</h4>
                    <p className="text-sm text-medical-neutral-600">{meldResult.interpretation}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-medical-neutral-700 mb-1">Transplant Priority</h4>
                    <p className="text-sm text-medical-neutral-600">{meldResult.transplantPriority}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end space-x-4">
            <Button
              onClick={resetForm}
              variant="outline"
              className="px-6"
            >
              Clear Form
            </Button>
            
            <Button
              onClick={saveLabResults}
              disabled={saving}
              className="btn-primary px-8"
            >
              {saving ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                "💾 Save Lab Results"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="medical-card p-6 bg-medical-neutral-50">
        <h3 className="text-lg font-semibold text-medical-neutral-900 mb-4">
          💡 How to Use This Form
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-medical-neutral-600">
          <div>
            <h4 className="font-medium text-medical-neutral-900 mb-2">Quick Entry</h4>
            <ul className="space-y-1">
              <li>• All fields are optional - enter only what you have</li>
              <li>• Units are pre-selected to standard values</li>
              <li>• Normal ranges shown for reference</li>
              <li>• Form saves everything at once</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-medical-neutral-900 mb-2">MELD Score</h4>
            <ul className="space-y-1">
              <li>• Enter Bilirubin, Creatinine & INR for automatic calculation</li>
              <li>• Add Sodium for MELD-Na score</li>
              <li>• Helps assess liver disease severity</li>
              <li>• Useful for transplant planning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
