"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { referenceRanges, type CanonicalMetric, type UnitOption } from "@/lib/metrics";
import { MedicalIntelligenceEngine } from "@/lib/medical-intelligence";
import { 
  calculateMELD, 
  extractMELDParameters, 
  validateMELDParameters,
  type MELDResult,
  type MELDParameters 
} from "@/lib/meld-calculator";
import { motion, AnimatePresence } from "framer-motion";

const commonLabTests: Array<{
  name: CanonicalMetric;
  displayName: string;
  icon: string;
  category: string;
  priority: number;
  description: string;
}> = [
  // MELD Score Components (Priority 1)
  { name: "Bilirubin", displayName: "Total Bilirubin", icon: "🟡", category: "MELD Score", priority: 1, description: "Liver function marker" },
  { name: "Creatinine", displayName: "Serum Creatinine", icon: "🔴", category: "MELD Score", priority: 1, description: "Kidney function" },
  { name: "INR", displayName: "INR", icon: "🩸", category: "MELD Score", priority: 1, description: "Blood clotting time" },
  
  // Core Liver Function (Priority 1)
  { name: "ALT", displayName: "ALT (SGPT)", icon: "🧪", category: "Liver Function", priority: 1, description: "Liver enzyme" },
  { name: "AST", displayName: "AST (SGOT)", icon: "🧪", category: "Liver Function", priority: 1, description: "Liver enzyme" },
  { name: "Albumin", displayName: "Albumin", icon: "🔵", category: "Liver Function", priority: 1, description: "Protein levels" },
  { name: "Platelets", displayName: "Platelet Count", icon: "🩸", category: "Blood Count", priority: 1, description: "Blood cell count" },
  
  // Additional Liver Tests (Priority 2)
  { name: "ALP", displayName: "Alkaline Phosphatase", icon: "⚗️", category: "Liver Function", priority: 2, description: "Liver enzyme" },
  { name: "GGT", displayName: "Gamma GT", icon: "🔬", category: "Liver Function", priority: 2, description: "Liver enzyme" },
  { name: "TotalProtein", displayName: "Total Protein", icon: "🟢", category: "Protein", priority: 2, description: "Protein levels" },
  
  // Electrolytes for MELD-Na (Priority 3)
  { name: "Sodium", displayName: "Sodium", icon: "🧂", category: "Electrolytes", priority: 3, description: "Electrolyte balance" },
  { name: "Potassium", displayName: "Potassium", icon: "🍌", category: "Electrolytes", priority: 3, description: "Electrolyte balance" },
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
  const [activeCategory, setActiveCategory] = useState<string>("MELD Score");

  const addLabEntry = (testName: CanonicalMetric) => {
    const existing = entries.find(e => e.name === testName);
    if (existing) return;

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
      case 'normal': return 'text-green-600 bg-green-50 border-green-200';
      case 'abnormal': return 'text-red-600 bg-red-50 border-red-200';
      case 'borderline': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-red-600';
      case 'reject': return 'text-red-600';
      default: return 'text-gray-500';
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

  const categories = Object.keys(testsByCategory);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100"
      >
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-xl">✍️</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manual Lab Entry</h1>
            <p className="text-gray-600 mt-1">Enter lab values from phone calls, consultations, or paper reports</p>
          </div>
        </div>
      </motion.div>

      {/* Report Information */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">📋</span>
          Report Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <Input
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              placeholder="e.g., Phone Results, Quick Entry"
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Date</label>
            <Input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Add Tests */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">🧪</span>
          Add Lab Tests
        </h2>
        
        {/* Category Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                activeCategory === category
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {testsByCategory[activeCategory]?.map((test) => {
            const isAdded = entries.some(e => e.name === test.name);
            return (
              <motion.button
                key={test.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addLabEntry(test.name)}
                disabled={isAdded}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isAdded
                    ? 'border-green-200 bg-green-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 bg-white'
                }`}
              >
                <div className="text-2xl mb-2">{test.icon}</div>
                <div className="font-medium text-sm text-gray-900">{test.displayName}</div>
                <div className="text-xs text-gray-500 mt-1">{test.description}</div>
                {isAdded && (
                  <div className="text-xs text-green-600 mt-2">✓ Added</div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Lab Entries */}
      <AnimatePresence>
        {entries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">📊</span>
              Lab Values ({entries.length})
            </h2>
            
            <div className="space-y-4">
              {entries.map((entry, index) => {
                const testInfo = commonLabTests.find(t => t.name === entry.name);
                const range = referenceRanges[entry.name];
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-gray-50 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{testInfo?.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{testInfo?.displayName || entry.name}</h3>
                          <p className="text-sm text-gray-500">{testInfo?.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {entry.status && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </span>
                        )}
                        <button
                          onClick={() => removeEntry(index)}
                          className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Test Value</label>
                        <Input
                          type="number"
                          step="any"
                          value={entry.value}
                          onChange={(e) => updateEntry(index, 'value', e.target.value)}
                          placeholder="Enter value"
                          className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                        <Select
                          value={entry.unit}
                          onValueChange={(value) => updateEntry(index, 'unit', value)}
                        >
                          <SelectTrigger className="border-gray-200">
                            <SelectValue placeholder={range?.standardUnit || "Select unit"} />
                          </SelectTrigger>
                          <SelectContent>
                            {(range?.unitOptions || [])
                              .filter((option) => option.value && option.value.trim() !== '')
                              .map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Reference Range & Analysis */}
                    {range && (
                      <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">
                            Normal range: {range.low} - {range.high} {range.standardUnit}
                          </span>
                          {entry.confidence && (
                            <span className={`text-sm font-medium ${getConfidenceColor(entry.confidence)}`}>
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
                                  <div className="text-sm text-gray-500 border-t pt-2">
                                    <span className="text-blue-600 font-medium">
                                      Converted: {conversion.convertedValue.toFixed(2)} {conversion.standardUnit}
                                    </span>
                                    <span className="ml-2 text-gray-400">
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
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4"
          >
            <div className="flex items-center space-x-2">
              <span className="text-red-600">⚠️</span>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MELD Score Display */}
      <AnimatePresence>
        {meldResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">🏥</span>
              Liver Disease Assessment
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">MELD Score</span>
                    <span className={`text-3xl font-bold ${
                      meldResult.urgency === 'Critical' ? 'text-red-600' :
                      meldResult.urgency === 'High' ? 'text-orange-600' :
                      meldResult.urgency === 'Medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {meldResult.meld}
                    </span>
                  </div>
                </div>
                
                {meldResult.meldNa && (
                  <div className="bg-white rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">MELD-Na Score</span>
                      <span className={`text-2xl font-bold ${
                        meldResult.urgency === 'Critical' ? 'text-red-600' :
                        meldResult.urgency === 'High' ? 'text-orange-600' :
                        meldResult.urgency === 'Medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {meldResult.meldNa}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
                  meldResult.urgency === 'Critical' ? 'bg-red-100 text-red-800' :
                  meldResult.urgency === 'High' ? 'bg-orange-100 text-orange-800' :
                  meldResult.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {meldResult.urgency} Priority
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Clinical Interpretation</h3>
                  <p className="text-sm text-gray-600">{meldResult.interpretation}</p>
                </div>
                
                <div className="bg-white rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Transplant Priority</h3>
                  <p className="text-sm text-gray-600">{meldResult.transplantPriority}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-white/50 rounded-xl">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> MELD score is calculated using Bilirubin, Creatinine, and INR values. 
                This is for informational purposes only and should not replace professional medical evaluation.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        {!savedId ? (
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={saveLabResults}
              disabled={saving || entries.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-xl shadow-lg"
            >
              {saving ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Clear All
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4"
            >
              <div className="flex items-center space-x-2">
                <span className="text-green-600 text-xl">✅</span>
                <div>
                  <span className="text-green-800 font-medium">Lab results saved successfully!</span>
                  <p className="text-sm text-green-600 mt-1">
                    Your manual lab entry has been processed and added to your health timeline.
                  </p>
                </div>
              </div>
            </motion.div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href={`/reports/${savedId}`} 
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-xl text-center shadow-lg"
              >
                <span className="mr-2">👁️</span>
                View Lab Report
              </a>
              <Button
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                <span className="mr-2">✍️</span>
                Add More Results
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
