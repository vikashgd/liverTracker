'use client';

import { useState, useMemo } from 'react';
import Link from "next/link";

interface LabMetric {
  name: string;
  value: number | null;
  unit: string | null;
  textValue: string | null;
}

interface LabDataPoint {
  id: string;
  date: Date;
  reportType: string | null;
  metrics: LabMetric[];
}

interface ConsolidatedLabReportProps {
  labData: LabDataPoint[];
}

// Comprehensive metric name normalization map
const METRIC_NORMALIZATION: Record<string, string[]> = {
  'Bilirubin': ['Bilirubin', 'Total Bilirubin', 'Serum Bilirubin', 'Bilirubin (Total)', 'Bilirubin Total', 'T. Bilirubin'],
  'Creatinine': ['Creatinine', 'Serum Creatinine', 'S. Creatinine', 'Creatinine (Serum)', 'Creatinine Serum'],
  'INR': ['INR', 'PT INR', 'INR (International Normalized Ratio)', 'Prothrombin INR', 'International Normalized Ratio'],
  'Sodium': ['Sodium', 'Na', 'Sodium (Na+)', 'Serum Sodium', 'Na+', 'Sodium+'],
  'SGPT/ALT': ['SGPT/ALT', 'ALT', 'SGPT', 'SGPT (ALT)', 'ALT (SGPT)', 'Alanine Aminotransferase', 'Alanine Transaminase'],
  'SGOT/AST': ['SGOT/AST', 'AST', 'SGOT', 'SGOT (AST)', 'AST (SGOT)', 'Aspartate Aminotransferase', 'Aspartate Transaminase'],
  'Alkaline Phosphatase': ['Alkaline Phosphatase', 'ALP', 'Alk Phos', 'Alkaline Phosphatase (ALP)', 'Alkaline Phos'],
  'Total Protein': ['Total Protein', 'Protein Total', 'Total Prot', 'Protein'],
  'Albumin': ['Albumin', 'Alb', 'Serum Albumin'],
  'Globulin': ['Globulin', 'Glob', 'Serum Globulin'],
  'A/G Ratio': ['A/G Ratio', 'Albumin/Globulin Ratio', 'A:G Ratio', 'Alb/Glob Ratio'],
  'Hemoglobin': ['Hemoglobin', 'Hgb', 'Hb', 'Hemoglobin (Hgb)'],
  'RBC': ['RBC', 'Red Blood Cells', 'Red Blood Cell Count', 'Erythrocyte Count'],
  'WBC': ['WBC', 'White Blood Cells', 'White Blood Cell Count', 'Leukocyte Count'],
  'Platelets': ['Platelets', 'Plt', 'Platelet Count', 'Thrombocyte Count'],
  'Alpha Feto Protein': ['Alpha Feto Protein', 'AFP', 'Alpha-Fetoprotein', 'Alpha Fetoprotein'],
  'Potassium': ['Potassium', 'K+', 'K', 'Serum Potassium'],
  'PT': ['PT', 'Prothrombin Time', 'Prothrombin Time (PT)'],
  'MNPT': ['MNPT', 'Mean Normal Prothrombin Time', 'Normal PT']
};

// Define standard lab parameters with their normal ranges
const LAB_PARAMETERS = [
  { name: 'Bilirubin', unit: 'mg/dL', range: [0.3, 1.2], category: 'liver' },
  { name: 'Creatinine', unit: 'mg/dL', range: [0.67, 1.17], category: 'kidney' },
  { name: 'INR', unit: '', range: [0.8, 1.2], category: 'coagulation' },
  { name: 'Sodium', unit: 'mEq/L', range: [136, 145], category: 'electrolyte' },
  { name: 'SGPT/ALT', unit: 'U/L', range: [0, 50], category: 'liver' },
  { name: 'SGOT/AST', unit: 'U/L', range: [0, 40], category: 'liver' },
  { name: 'Total Protein', unit: 'g/dL', range: [6.0, 8.3], category: 'protein' },
  { name: 'Alkaline Phosphatase', unit: 'U/L', range: [44, 147], category: 'liver' },
  { name: 'Albumin', unit: 'g/dL', range: [3.4, 5.4], category: 'protein' },
  { name: 'Globulin', unit: 'g/dL', range: [2.0, 3.5], category: 'protein' },
  { name: 'A/G Ratio', unit: '', range: [1.1, 2.2], category: 'protein' },
  { name: 'Hemoglobin', unit: 'g/dL', range: [12.0, 16.0], category: 'blood' },
  { name: 'RBC', unit: 'M/µL', range: [4.5, 5.9], category: 'blood' },
  { name: 'WBC', unit: 'K/µL', range: [4.0, 11.0], category: 'blood' },
  { name: 'Platelets', unit: 'K/µL', range: [150, 450], category: 'blood' },
  { name: 'Alpha Feto Protein', unit: 'ng/mL', range: [0, 10], category: 'tumor' },
  { name: 'Potassium', unit: 'mEq/L', range: [3.5, 5.0], category: 'electrolyte' },
  { name: 'PT', unit: 'sec', range: [9.4, 12.5], category: 'coagulation' },
  { name: 'MNPT', unit: 'sec', range: [9.4, 12.5], category: 'coagulation' }
];

// MELD Score calculation function with clinical bounds
const calculateMELD = (bilirubin: number, creatinine: number, inr: number): number => {
  // Apply clinical bounds: minimum 1.0 for all parameters, creatinine max 4.0
  const clampedBilirubin = Math.max(bilirubin, 1.0);
  const clampedCreatinine = Math.max(Math.min(creatinine, 4.0), 1.0);
  const clampedINR = Math.max(inr, 1.0);
  
  // MELD = 3.78 × ln(serum bilirubin) + 11.2 × ln(INR) + 9.57 × ln(serum creatinine) + 6.43
  const meld = 3.78 * Math.log(clampedBilirubin) + 11.2 * Math.log(clampedINR) + 9.57 * Math.log(clampedCreatinine) + 6.43;
  return Math.round(meld);
};

// MELD-Na Score calculation function (includes sodium)
const calculateMELDNa = (bilirubin: number, creatinine: number, inr: number, sodium: number): number => {
  // Apply clinical bounds: sodium clamped to 125-137
  const clampedSodium = Math.max(Math.min(sodium, 137), 125);
  
  const meld = calculateMELD(bilirubin, creatinine, inr);
  const sodiumFactor = 137 - clampedSodium;
  const meldNa = meld + 1.32 * sodiumFactor - (0.033 * meld * sodiumFactor);
  return Math.round(Math.max(meldNa, meld)); // MELD-Na cannot be less than MELD
};

// Parse numeric value from textValue when value is null
const parseNumericFromText = (textValue: string | null): number | null => {
  if (!textValue) return null;
  
  // Remove common prefixes and extract first numeric value
  const cleanText = textValue
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/,/g, '') // Remove commas
    .trim();
  
  // Match first numeric value (including decimals)
  const numericMatch = cleanText.match(/^(\d+\.?\d*)/);
  if (numericMatch) {
    const parsed = parseFloat(numericMatch[1]);
    return isNaN(parsed) ? null : parsed;
  }
  
  return null;
};

// Normalize metric name to canonical form
const normalizeMetricName = (metricName: string): string => {
  const normalizedName = metricName.trim();
  
  // Check if this metric matches any of our known parameters
  for (const [canonicalName, variants] of Object.entries(METRIC_NORMALIZATION)) {
    if (variants.some(variant => 
      normalizedName.toLowerCase().includes(variant.toLowerCase()) ||
      variant.toLowerCase().includes(normalizedName.toLowerCase())
    )) {
      return canonicalName;
    }
  }
  
  // Return original name if no match found
  return normalizedName;
};

export function ConsolidatedLabReport({ labData }: ConsolidatedLabReportProps) {
  const [selectedParameters, setSelectedParameters] = useState<string[]>([]);
  const [showAllParameters, setShowAllParameters] = useState(true);
  const [groupByMonth, setGroupByMonth] = useState(true);

  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (diffDays <= 365) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.getFullYear().toString();
    }
  };

  // Normalize and enrich lab data with parsed values
  const normalizedLabData = useMemo(() => {
    return labData.map(dataPoint => ({
      ...dataPoint,
      metrics: dataPoint.metrics.map(metric => {
        // Parse numeric value from textValue if value is null
        let finalValue = metric.value;
        if (finalValue === null && metric.textValue) {
          finalValue = parseNumericFromText(metric.textValue);
        }
        
        return {
          ...metric,
          value: finalValue,
          normalizedName: normalizeMetricName(metric.name)
        };
      })
    }));
  }, [labData]);

  // Get unique dates and group by month if enabled
  const dateGroups = useMemo(() => {
    if (!groupByMonth) {
      // Individual dates - use UTC date strings for consistency
      const uniqueDates = [...new Set(normalizedLabData.map(d => 
        `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, '0')}-${String(d.date.getDate()).padStart(2, '0')}`
      ))];
      
      return uniqueDates
        .sort()
        .map(dateStr => {
          const [year, month, day] = dateStr.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          return {
            key: dateStr,
            label: formatDate(date),
            fullDate: date,
            dates: [date]
          };
        });
    } else {
      // Group by month - use UTC month keys
      const monthGroups = new Map<string, { label: string; dates: Date[]; fullDate: Date }>();
      
      normalizedLabData.forEach(dataPoint => {
        const monthKey = `${dataPoint.date.getFullYear()}-${String(dataPoint.date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = dataPoint.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (!monthGroups.has(monthKey)) {
          monthGroups.set(monthKey, {
            label: monthLabel,
            dates: [],
            fullDate: dataPoint.date
          });
        }
        monthGroups.get(monthKey)!.dates.push(dataPoint.date);
      });
      
      return Array.from(monthGroups.values())
        .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
        .map(group => ({
          key: group.label,
          label: group.label,
          fullDate: group.fullDate,
          dates: group.dates.sort((a, b) => a.getTime() - b.getTime())
        }));
    }
  }, [normalizedLabData, groupByMonth]);

  // Get all available parameters from the normalized data
  const availableParameters = useMemo(() => {
    const params = new Set<string>();
    normalizedLabData.forEach(dataPoint => {
      dataPoint.metrics.forEach(metric => {
        params.add(metric.normalizedName);
      });
    });
    return Array.from(params).sort();
  }, [normalizedLabData]);

  // Create comprehensive parameter list: known parameters + discovered parameters
  const allParameters = useMemo(() => {
    const knownParams = LAB_PARAMETERS.map(p => p.name);
    const discoveredParams = availableParameters.filter(p => !knownParams.includes(p));
    
    return [
      ...LAB_PARAMETERS,
      ...discoveredParams.map(name => ({
        name,
        unit: null,
        range: [null, null],
        category: 'discovered'
      }))
    ];
  }, [availableParameters]);

  // Filter parameters to show
  const parametersToShow = showAllParameters 
    ? allParameters
    : allParameters.filter(p => selectedParameters.includes(p.name));

  // Get value for a specific parameter and date group
  const getValue = (parameterName: string, dateGroup: { dates: Date[] }): { value: number | null; unit: string | null; isAbnormal: boolean; count: number } => {
    let totalValue = 0;
    let count = 0;
    let unit: string | null = null;
    
    dateGroup.dates.forEach(date => {
      const dataPoint = normalizedLabData.find(d => {
        const dataDate = `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, '0')}-${String(d.date.getDate()).padStart(2, '0')}`;
        const groupDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return dataDate === groupDate;
      });
      
      if (!dataPoint) return;

      // Find metric by normalized name
      const metric = dataPoint.metrics.find(m => m.normalizedName === parameterName);
      if (!metric || metric.value === null) return;

      totalValue += metric.value;
      count++;
      unit = metric.unit;
    });

    if (count === 0) return { value: null, unit: null, isAbnormal: false, count: 0 };
    
    const avgValue = totalValue / count;
    const param = LAB_PARAMETERS.find(p => p.name === parameterName);
    
    if (!param || !param.range[0] || !param.range[1]) {
      return { value: avgValue, unit, isAbnormal: false, count };
    }
    
    const isAbnormal = avgValue < param.range[0] || avgValue > param.range[1];
    return { value: avgValue, unit, isAbnormal, count };
  };

  // Calculate MELD scores for each date group
  const meldScores = useMemo(() => {
    return dateGroups.map(dateGroup => {
      // Get values for MELD calculation using normalized names
      const bilirubin = getValue('Bilirubin', dateGroup);
      const creatinine = getValue('Creatinine', dateGroup);
      const inr = getValue('INR', dateGroup);
      const sodium = getValue('Sodium', dateGroup);

      let meldScore: number | null = null;
      let meldNaScore: number | null = null;
      let canCalculateMELD = false;
      let canCalculateMELDNa = false;

      // Check if we can calculate MELD (need bilirubin, creatinine, INR)
      if (bilirubin.value !== null && creatinine.value !== null && inr.value !== null) {
        canCalculateMELD = true;
        try {
          meldScore = calculateMELD(bilirubin.value, creatinine.value, inr.value);
        } catch (error) {
          console.warn('Error calculating MELD:', error);
        }
      }

      // Check if we can calculate MELD-Na (need sodium in addition)
      if (canCalculateMELD && sodium.value !== null) {
        canCalculateMELDNa = true;
        try {
          meldNaScore = calculateMELDNa(bilirubin.value!, creatinine.value!, inr.value!, sodium.value);
        } catch (error) {
          console.warn('Error calculating MELD-Na:', error);
        }
      }

      return {
        dateGroup,
        meldScore,
        meldNaScore,
        canCalculateMELD,
        canCalculateMELDNa,
        parameters: {
          bilirubin: bilirubin.value,
          creatinine: creatinine.value,
          inr: inr.value,
          sodium: sodium.value
        }
      };
    });
  }, [dateGroups, normalizedLabData]);

  // Get parameter category color
  const getCategoryColor = (category: string) => {
    const colors = {
      liver: 'bg-blue-50 border-blue-200 text-blue-700',
      kidney: 'bg-green-50 border-green-200 text-green-700',
      coagulation: 'bg-purple-50 border-purple-200 text-purple-700',
      electrolyte: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      protein: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      blood: 'bg-red-50 border-red-200 text-red-700',
      tumor: 'bg-pink-50 border-pink-200 text-pink-700',
      score: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      discovered: 'bg-gray-50 border-gray-200 text-gray-700'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <Link 
                href="/reports" 
                className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium"
              >
                <span className="mr-2">←</span>
                Back to Reports
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📊 Consolidated Lab Report
              </h1>
              <p className="text-lg text-gray-600">
                Track your lab values over time with trend analysis
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showAllParameters}
                    onChange={(e) => setShowAllParameters(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Show all parameters
                  </span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={groupByMonth}
                    onChange={(e) => setGroupByMonth(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Group by month
                  </span>
                </label>
                
                {!showAllParameters && (
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Select parameters:</label>
                    <select
                      multiple
                      value={selectedParameters}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedParameters(values);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-w-[200px]"
                    >
                      {availableParameters.map(param => (
                        <option key={param} value={param}>{param}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-600">
                {dateGroups.length} {groupByMonth ? 'month' : 'date'}{dateGroups.length !== 1 ? 's' : ''} • {parametersToShow.length} parameter{parametersToShow.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Consolidated Lab Report Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {/* Sticky Parameter Column */}
                  <th className="sticky left-0 z-10 bg-gray-50 border-r border-gray-200 px-6 py-4 text-left font-semibold text-gray-900 min-w-[220px]">
                    <div className="flex items-center space-x-2">
                      <span>Lab Parameter</span>
                      <span className="text-xs text-gray-500 font-normal">(Normal Range)</span>
                    </div>
                  </th>
                  
                  {/* Date/Month Columns */}
                  {dateGroups.map((dateGroup, index) => (
                    <th key={index} className="border-b border-gray-200 px-4 py-4 text-center font-semibold text-gray-900 min-w-[140px]">
                      <div className="text-sm font-medium">{dateGroup.label}</div>
                      {!groupByMonth && (
                        <div className="text-xs text-gray-500 font-normal mt-1">
                          {dateGroup.fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                      {groupByMonth && (
                        <div className="text-xs text-gray-500 font-normal mt-1">
                          {dateGroup.dates.length} test{dateGroup.dates.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </th>
                  ))}
                  
                  {/* Range Column */}
                  <th className="border-b border-gray-200 px-4 py-4 text-center font-semibold text-gray-900 min-w-[120px] bg-yellow-50">
                    Reference Range
                  </th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-200">
                {parametersToShow.map((param, paramIndex) => {
                  const categoryColor = getCategoryColor(param.category);
                  const isMELD = param.name.includes('MELD');
                  
                  return (
                    <tr 
                      key={param.name} 
                      className={`${paramIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isMELD ? 'bg-emerald-50' : ''} hover:bg-gray-100`}
                    >
                      {/* Sticky Parameter Column */}
                      <td className="sticky left-0 z-10 bg-inherit border-r border-gray-200 px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${categoryColor}`}>
                            {param.name}
                          </span>
                          {param.unit && (
                            <span className="text-sm text-gray-500">
                              {param.unit}
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Date/Month Value Columns */}
                      {dateGroups.map((dateGroup, dateIndex) => {
                        const { value, unit, isAbnormal, count } = getValue(param.name, dateGroup);
                        
                        return (
                          <td key={dateIndex} className="border-b border-gray-200 px-4 py-4 text-center">
                            {value !== null ? (
                              <div className="space-y-1">
                                <div className={`font-semibold text-lg ${isAbnormal ? 'text-red-600 bg-red-50 px-3 py-1 rounded-md' : 'text-gray-900'}`}>
                                  {value.toFixed(2)}
                                  {param.unit && <span className="text-sm text-gray-500 ml-1">{param.unit}</span>}
                                </div>
                                {groupByMonth && count > 1 && (
                                  <div className="text-xs text-gray-500">
                                    Avg of {count} values
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </td>
                        );
                      })}
                      
                      {/* Range Column */}
                      <td className="border-b border-gray-200 px-4 py-4 text-center bg-yellow-50">
                        {param.range[0] !== null && param.range[1] !== null ? (
                          <>
                            <div className="text-sm font-semibold text-gray-900">
                              {param.range[0]} - {param.range[1]}
                            </div>
                            {param.unit && (
                              <div className="text-xs text-gray-500 mt-1">
                                {param.unit}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-xs text-gray-500">
                            No reference range
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-red-100 border-2 border-red-300 rounded-md"></div>
              <span className="text-sm text-gray-700">Abnormal values (outside range)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-emerald-100 border-2 border-emerald-300 rounded-md"></div>
              <span className="text-sm text-gray-700">MELD scores (liver function)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-yellow-100 border-2 border-yellow-300 rounded-md"></div>
              <span className="text-sm text-gray-700">Reference ranges</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-blue-100 border-2 border-blue-300 rounded-md"></div>
              <span className="text-sm text-gray-700">Liver function tests</span>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-gray-100 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Info</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Total data points: {labData.length}</div>
              <div>Normalized parameters: {availableParameters.length}</div>
              <div>Date groups: {dateGroups.length}</div>
              <div>Parameters shown: {parametersToShow.length}</div>
              <div>Known parameters: {LAB_PARAMETERS.length}</div>
              <div>Discovered parameters: {availableParameters.filter(p => !LAB_PARAMETERS.map(lp => lp.name).includes(p)).length}</div>
            </div>
            
            {/* Show normalized metric mapping */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Normalized Metrics:</h4>
              <div className="text-xs text-gray-600 max-h-32 overflow-y-auto">
                {availableParameters.slice(0, 20).map(param => (
                  <div key={param} className="mb-1">
                    <span className="font-medium">{param}</span>
                    {LAB_PARAMETERS.find(lp => lp.name === param) ? 
                      <span className="text-green-600 ml-2">✓ Known</span> : 
                      <span className="text-blue-600 ml-2">🔍 Discovered</span>
                    }
                  </div>
                ))}
                {availableParameters.length > 20 && (
                  <div className="text-gray-500">... and {availableParameters.length - 20} more</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

