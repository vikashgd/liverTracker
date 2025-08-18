"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { referenceRanges, type CanonicalMetric, type UnitOption } from "@/lib/metrics";
import { MedicalIntelligenceEngine } from "@/lib/medical-intelligence";
import { calculateMELD, extractMELDParameters, type MELDResult } from "@/lib/meld-calculator";

const commonLabTests: Array<{
  name: CanonicalMetric;
  displayName: string;
  icon: string;
  category: string;
  priority: number;
}> = [
  // MELD Score Components (Priority 1)
  { name: "Bilirubin", displayName: "Total Bilirubin", icon: "🟡", category: "MELD Score", priority: 1 },
  { name: "Creatinine", displayName: "Serum Creatinine", icon: "🔴", category: "MELD Score", priority: 1 },
  { name: "INR", displayName: "INR", icon: "🩸", category: "MELD Score", priority: 1 },
  
  // Core Liver Function (Priority 1)
  { name: "ALT", displayName: "ALT (SGPT)", icon: "🧪", category: "Liver Function", priority: 1 },
  { name: "AST", displayName: "AST (SGOT)", icon: "🧪", category: "Liver Function", priority: 1 },
  { name: "Albumin", displayName: "Albumin", icon: "🔵", category: "Liver Function", priority: 1 },
  { name: "Platelets", displayName: "Platelet Count", icon: "🩸", category: "Blood Count", priority: 1 },
  
  // Additional Liver Tests (Priority 2)
  { name: "ALP", displayName: "Alkaline Phosphatase", icon: "⚗️", category: "Liver Function", priority: 2 },
  { name: "GGT", displayName: "Gamma GT", icon: "🔬", category: "Liver Function", priority: 2 },
  { name: "TotalProtein", displayName: "Total Protein", icon: "🟢", category: "Protein", priority: 2 },
  
  // Electrolytes for MELD-Na (Priority 3)
  { name: "Sodium", displayName: "Sodium", icon: "🧂", category: "Electrolytes", priority: 3 },
  { name: "Potassium", displayName: "Potassium", icon: "🍌", category: "Electrolytes", priority: 3 },
];

type LabEntry = {
  name: CanonicalMetric;
  value: string;
  unit: string;
  confidence?: 'high' | 'medium' | 'low' | 'reject';
  status?: 'normal' | 'abnormal' | 'borderline';
};

export function ManualLabEntry() {
  const [entries, setEntries] = useState<LabEntry[]>([]);
  const [reportDate, setReportDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reportType, setReportType] = useState<string>("Manual Lab Entry");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meldResult, setMeldResult] = useState<MELDResult | null>(null);

  const addLabEntry = (testName: CanonicalMetric) => {
    const existing = entries.find(e => e.name === testName);
    if (existing) return;

    const testInfo = commonLabTests.find(t => t.name === testName);
    const range = referenceRanges[testName];
    
    setEntries([...entries, {
      name: testName,
      value: "",
      unit: range?.standardUnit || "",
    }]);
  };

  const convertToStandardUnit = (value: number, fromUnit: string, testName: CanonicalMetric): { convertedValue: number; standardUnit: string } | null => {
    const range = referenceRanges[testName];
    if (!range) return null;
    
    const unitOption = range.unitOptions.find(opt => opt.value === fromUnit);
    if (!unitOption || unitOption.isStandard) {
      return { convertedValue: value, standardUnit: range.standardUnit };
    }
    
    const conversionFactor = unitOption.conversionFactor || 1;
    return {
      convertedValue: value * conversionFactor,
      standardUnit: range.standardUnit
    };
  };

  const updateEntry = (index: number, field: keyof LabEntry, value: string) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };

    // Auto-analyze the value if both value and unit are provided
    if (field === 'value' || field === 'unit') {
      const entry = newEntries[index];
      if (entry.value && entry.unit) {
        const numValue = parseFloat(entry.value);
        if (!isNaN(numValue)) {
          const analysis = MedicalIntelligenceEngine.processValue(entry.name, numValue, entry.unit);
          newEntries[index].confidence = analysis.confidence;
          
          // Determine status based on reference ranges
          const range = referenceRanges[entry.name];
          if (range && analysis.isValid && analysis.normalizedValue !== null) {
            const normalized = analysis.normalizedValue;
            if (normalized < range.low * 0.8 || normalized > range.high * 1.2) {
              newEntries[index].status = 'abnormal';
            } else if (normalized < range.low || normalized > range.high) {
              newEntries[index].status = 'borderline';
            } else {
              newEntries[index].status = 'normal';
            }
          }
        }
      }
    }

    setEntries(newEntries);
    
    // Calculate MELD score if we have the required parameters
    const meldParams = extractMELDParameters(newEntries);
    if (meldParams) {
      const result = calculateMELD(meldParams);
      setMeldResult(result);
    } else {
      setMeldResult(null);
    }
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'normal': return 'text-medical-success-600 bg-medical-success-50 border-medical-success-200';
      case 'abnormal': return 'text-medical-error-600 bg-medical-error-50 border-medical-error-200';
      case 'borderline': return 'text-medical-warning-600 bg-medical-warning-50 border-medical-warning-200';
      default: return 'text-medical-neutral-600 bg-medical-neutral-50 border-medical-neutral-200';
    }
  };

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'high': return 'text-medical-success-600';
      case 'medium': return 'text-medical-warning-600';
      case 'low': return 'text-medical-error-600';
      case 'reject': return 'text-red-600';
      default: return 'text-medical-neutral-500';
    }
  };

  const saveLabResults = async () => {
    if (entries.length === 0) {
      setError("Please add at least one lab value");
      return;
    }

    if (!reportDate) {
      setError("Please select a report date");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Convert entries to the format expected by the API
      const metricsAll = entries
        .filter(entry => entry.value && !isNaN(parseFloat(entry.value)))
        .map(entry => ({
          name: entry.name,
          value: parseFloat(entry.value),
          unit: entry.unit || null,
          category: "Manual Entry"
        }));

      const extractedData = {
        reportType,
        reportDate,
        metricsAll
      };

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectKey: `manual/${Date.now()}-manual-entry`,
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
      
      // Reset form
      setEntries([]);
      setError(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save lab results");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEntries([]);
    setSavedId(null);
    setError(null);
    setReportDate(new Date().toISOString().split('T')[0]);
    setReportType("Manual Lab Entry");
  };

  // Group tests by category
  const testsByCategory = commonLabTests.reduce((acc, test) => {
    if (!acc[test.category]) acc[test.category] = [];
    acc[test.category].push(test);
    return acc;
  }, {} as Record<string, typeof commonLabTests>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="medical-card-primary">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-medical-success-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">✍️</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-medical-neutral-900">
              Manual Lab Entry
            </h2>
            <p className="text-sm text-medical-neutral-600">
              Quickly enter lab values from phone calls, consultations, or paper reports
            </p>
          </div>
        </div>

        {/* Report Information */}
        <div className="bg-medical-neutral-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-medical-neutral-900 mb-3">Report Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="manual-report-type" className="block text-sm font-medium text-medical-neutral-700 mb-1">
                Report Type
              </label>
              <Input
                id="manual-report-type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                placeholder="e.g., Phone Results, Quick Entry"
                className="text-sm"
              />
            </div>
            <div>
              <label htmlFor="manual-report-date" className="block text-sm font-medium text-medical-neutral-700 mb-1">
                Test Date
              </label>
              <Input
                id="manual-report-date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Quick Add Tests */}
        <div className="mb-6">
          <h3 className="font-medium text-medical-neutral-900 mb-3">Quick Add Common Tests</h3>
          {Object.entries(testsByCategory).map(([category, tests]) => (
            <div key={category} className="mb-4">
              <h4 className="text-sm font-medium text-medical-neutral-700 mb-2">{category}</h4>
              <div className="flex flex-wrap gap-2">
                {tests
                  .sort((a, b) => a.priority - b.priority)
                  .map((test) => (
                    <Button
                      key={test.name}
                      variant="outline"
                      size="sm"
                      onClick={() => addLabEntry(test.name)}
                      disabled={entries.some(e => e.name === test.name)}
                      className="btn-secondary text-xs"
                    >
                      <span className="mr-1">{test.icon}</span>
                      {test.displayName}
                    </Button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Lab Entries */}
        {entries.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium text-medical-neutral-900 mb-3 flex items-center space-x-2">
              <span>🧪</span>
              <span>Lab Values ({entries.length})</span>
            </h3>
            <div className="space-y-3">
              {entries.map((entry, index) => {
                const testInfo = commonLabTests.find(t => t.name === entry.name);
                const range = referenceRanges[entry.name];
                
                return (
                  <div key={index} className="bg-white border border-medical-neutral-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{testInfo?.icon}</span>
                        <h4 className="font-medium text-medical-neutral-900">
                          {testInfo?.displayName || entry.name}
                        </h4>
                        {entry.status && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEntry(index)}
                        className="text-medical-error-600 hover:bg-medical-error-50"
                      >
                        ✕
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`value-${index}`} className="block text-xs font-medium text-medical-neutral-600 mb-1">
                          Test Value
                        </label>
                        <Input
                          id={`value-${index}`}
                          type="number"
                          step="any"
                          value={entry.value}
                          onChange={(e) => updateEntry(index, 'value', e.target.value)}
                          placeholder="Enter value"
                          className="text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label htmlFor={`unit-${index}`} className="block text-xs font-medium text-medical-neutral-600 mb-1">
                          Unit
                        </label>
                        <Select
                          value={entry.unit}
                          onValueChange={(value) => updateEntry(index, 'unit', value)}
                          placeholder={range?.standardUnit || "Select unit"}
                          options={range?.unitOptions || []}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Reference Range & Analysis */}
                    {range && (
                      <div className="mt-3 p-2 bg-medical-neutral-50 rounded text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-medical-neutral-600">
                            Normal: {range.low} - {range.high} {range.standardUnit}
                          </span>
                          {entry.confidence && (
                            <span className={`font-medium ${getConfidenceColor(entry.confidence)}`}>
                              {entry.confidence} confidence
                            </span>
                          )}
                        </div>
                        
                        {/* Unit Conversion Display */}
                        {entry.value && entry.unit && entry.unit !== range.standardUnit && (
                          (() => {
                            const numValue = parseFloat(entry.value);
                            if (!isNaN(numValue)) {
                              const conversion = convertToStandardUnit(numValue, entry.unit, entry.name);
                              if (conversion) {
                                return (
                                  <div className="text-medical-neutral-500 border-t pt-1">
                                    <span className="text-medical-primary-600 font-medium">
                                      Converted: {conversion.convertedValue.toFixed(2)} {conversion.standardUnit}
                                    </span>
                                    <span className="ml-2 text-medical-neutral-400">
                                      ({entry.value} {entry.unit} → standard units)
                                    </span>
                                  </div>
                                );
                              }
                            }
                            return null;
                          })()
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-message mb-6" role="alert">
            <div className="flex items-center space-x-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* MELD Score Display */}
        {meldResult && (
          <div className="mb-6">
            <div className="medical-card p-6">
              <h3 className="text-lg font-semibold text-medical-neutral-900 mb-4 flex items-center">
                <span className="mr-2">🏥</span>
                Liver Disease Assessment
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* MELD Score */}
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
                
                {/* Clinical Interpretation */}
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
              
              <div className="mt-4 p-3 bg-medical-neutral-50 rounded text-xs text-medical-neutral-500">
                <p><strong>Note:</strong> MELD score is calculated using Bilirubin, Creatinine, and INR values. This is for informational purposes only and should not replace professional medical evaluation.</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t border-medical-neutral-200 pt-6">
          {!savedId ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={saveLabResults}
                disabled={saving || entries.length === 0}
                className="btn-success"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <div className="loading-spinner"></div>
                    <span>Saving Results...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>💾</span>
                    <span>Save Lab Results</span>
                  </div>
                )}
              </Button>
              
              {entries.length > 0 && (
                <Button
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Clear All
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="success-message">
                <div className="flex items-center space-x-2">
                  <span>✅</span>
                  <span className="font-medium">Lab results saved successfully!</span>
                </div>
                <p className="text-sm mt-1">
                  Your manual lab entry has been processed and added to your health timeline.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <a 
                  href={`/reports/${savedId}`} 
                  className="btn-primary text-center"
                >
                  <span className="mr-2">👁️</span>
                  View Lab Report
                </a>
                <Button
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  <span className="mr-2">✍️</span>
                  Add More Results
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
