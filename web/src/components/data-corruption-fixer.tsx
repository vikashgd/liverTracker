"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CorruptedRecord {
  id: string;
  reportId: string;
  originalValue: number;
  correctedValue: number;
  originalUnit: string;
  reason: string;
  confidence: string;
}

interface AnalysisResult {
  corruptedRecords: CorruptedRecord[];
  summary: {
    totalRecords: number;
    corruptedCount: number;
    correctionsMade: number;
  };
}

export function DataCorruptionFixer() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);

  const analyzeData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/fix-corruption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze' })
      });
      const result = await response.json();
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fixData = async () => {
    setFixing(true);
    try {
      const response = await fetch('/api/admin/fix-corruption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix' })
      });
      const result = await response.json();
      setFixResult(result);
      setAnalysis(result.analysisResult);
    } catch (error) {
      console.error('Fix failed:', error);
    } finally {
      setFixing(false);
    }
  };

  const getReasonDescription = (reason: string) => {
    switch (reason) {
      case 'double_conversion_10_9_L':
        return '🔄 Double unit conversion - Raw count incorrectly labeled as 10^9/L';
      case 'impossible_range_standard_unit':
        return '❌ Impossible range for stated unit';
      case 'raw_count_mislabeled':
        return '🏷️ Raw count needs proper unit conversion';
      case 'should_be_raw_count':
        return '🔢 Should be treated as raw count (/μL)';
      case 'high_confidence_impossible':
        return '⚠️ High confidence but impossible value';
      default:
        return reason;
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'double_conversion_10_9_L':
      case 'raw_count_mislabeled':
      case 'should_be_raw_count':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'impossible_range_standard_unit':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-medical-neutral-900">
            🔧 Data Corruption Analysis & Fix
          </h2>
          <p className="text-medical-neutral-600">
            Identify and correct corrupted platelet values from double unit conversion
          </p>
        </div>
        <div className="space-x-2">
          <Button onClick={analyzeData} disabled={loading}>
            {loading ? '🔍 Analyzing...' : '🔍 Analyze Data'}
          </Button>
          {analysis && analysis.corruptedRecords.length > 0 && (
            <Button onClick={fixData} disabled={fixing} className="bg-red-600 text-white hover:bg-red-700">
              {fixing ? '🔧 Fixing...' : '🔧 Apply Fixes'}
            </Button>
          )}
        </div>
      </div>

      {/* Analysis Summary */}
      {analysis && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Analysis Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analysis.summary.totalRecords}</div>
              <div className="text-sm text-medical-neutral-600">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{analysis.summary.corruptedCount}</div>
              <div className="text-sm text-medical-neutral-600">Corrupted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analysis.summary.correctionsMade}</div>
              <div className="text-sm text-medical-neutral-600">Fixed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {((analysis.summary.totalRecords - analysis.summary.corruptedCount) / analysis.summary.totalRecords * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-medical-neutral-600">Data Quality</div>
            </div>
          </div>

          {analysis.corruptedRecords.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-green-500 text-4xl mb-2">✅</div>
              <p className="text-medical-neutral-600">No data corruption detected!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="font-medium text-medical-neutral-900">
                🚨 Corrupted Records ({analysis.corruptedRecords.length})
              </h4>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {analysis.corruptedRecords.map((record, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${getReasonColor(record.reason)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        Report: {record.reportId.slice(-8)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        record.confidence === 'high' ? 'bg-green-100 text-green-800' :
                        record.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.confidence} confidence
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <div>
                        <div className="text-sm font-medium text-red-700">Original:</div>
                        <div className="font-mono">{record.originalValue.toLocaleString()} {record.originalUnit}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-green-700">Corrected:</div>
                        <div className="font-mono">{record.correctedValue.toFixed(1)} 10^9/L</div>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium">Issue:</span> {getReasonDescription(record.reason)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Fix Results */}
      {fixResult && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-4">✅ Fix Results</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Corrections Applied:</span>
              <span className="font-semibold">{fixResult.correctionResult.correctionsMade}</span>
            </div>
            <div className="flex justify-between">
              <span>Success:</span>
              <span className="font-semibold">{fixResult.correctionResult.success ? '✅ Yes' : '❌ No'}</span>
            </div>
            {fixResult.correctionResult.errors.length > 0 && (
              <div>
                <div className="text-red-700 font-medium">Errors:</div>
                <ul className="text-sm text-red-600">
                  {fixResult.correctionResult.errors.map((error: string, idx: number) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-blue-800 font-medium">💡 Next Steps:</div>
            <ol className="text-sm text-blue-700 mt-1">
              <li>1. Refresh your dashboard to see the corrected values</li>
              <li>2. The extreme values (55000, 60000) should now be normal ranges</li>
              <li>3. Check that duplicate detection is working properly</li>
            </ol>
          </div>
        </Card>
      )}

      {/* Help Information */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">ℹ️ About Data Corruption</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <p>
            <strong>Common Issues:</strong> Platelet values like 55,000 × 10^9/L are physically impossible. 
            Normal platelets range from 150-450 × 10^9/L.
          </p>
          <p>
            <strong>Root Cause:</strong> Raw platelet counts (like 550,000 /μL) were incorrectly processed 
            as already being in 10^9/L units, causing double conversion.
          </p>
          <p>
            <strong>The Fix:</strong> Convert raw counts to proper 10^9/L units by dividing by 1000 
            (since 1 × 10^9/L = 1000 × 10^6/L = 1000 /μL).
          </p>
        </div>
      </Card>
    </div>
  );
}
