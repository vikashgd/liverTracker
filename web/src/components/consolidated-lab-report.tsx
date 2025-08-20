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
  { name: 'MNPT', unit: 'sec', range: [9.4, 12.5], category: 'coagulation' },
  { name: 'MELD', unit: '', range: [6, 40], category: 'score' },
  { name: 'MELD New', unit: '', range: [6, 40], category: 'score' }
];

// MELD Score calculation function
const calculateMELD = (bilirubin: number, creatinine: number, inr: number): number => {
  // MELD = 3.78 × ln(serum bilirubin) + 11.2 × ln(INR) + 9.57 × ln(serum creatinine) + 6.43
  const meld = 3.78 * Math.log(bilirubin) + 11.2 * Math.log(inr) + 9.57 * Math.log(creatinine) + 6.43;
  return Math.round(meld);
};

// MELD-Na Score calculation function (includes sodium)
const calculateMELDNa = (bilirubin: number, creatinine: number, inr: number, sodium: number): number => {
  // MELD-Na = MELD + 1.32 × (137 - Na) - [0.033 × MELD × (137 - Na)]
  const meld = calculateMELD(bilirubin, creatinine, inr);
  const sodiumFactor = 137 - sodium;
  const meldNa = meld + 1.32 * sodiumFactor - (0.033 * meld * sodiumFactor);
  return Math.round(Math.max(meldNa, meld)); // MELD-Na cannot be less than MELD
};

export function ConsolidatedLabReport({ labData }: ConsolidatedLabReportProps) {
  const [selectedParameters, setSelectedParameters] = useState<string[]>([]);
  const [showAllParameters, setShowAllParameters] = useState(true);
  const [groupByMonth, setGroupByMonth] = useState(true);

  // Format date for display - moved above useMemo to fix reference error
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

  // Get unique dates and group by month if enabled
  const dateGroups = useMemo(() => {
    if (!groupByMonth) {
      // Individual dates
      const uniqueDates = [...new Set(labData.map(d => d.date.toDateString()))];
      return uniqueDates
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => a.getTime() - b.getTime())
        .map(date => ({
          key: date.toDateString(),
          label: formatDate(date),
          fullDate: date,
          dates: [date]
        }));
    } else {
      // Group by month
      const monthGroups = new Map<string, { label: string; dates: Date[]; fullDate: Date }>();
      
      labData.forEach(dataPoint => {
        const monthKey = `${dataPoint.date.getFullYear()}-${dataPoint.date.getMonth()}`;
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
  }, [labData, groupByMonth]);

  // Get all available parameters from the data
  const availableParameters = useMemo(() => {
    const params = new Set<string>();
    labData.forEach(dataPoint => {
      dataPoint.metrics.forEach(metric => {
        params.add(metric.name);
      });
    });
    return Array.from(params).sort();
  }, [labData]);

  // Filter parameters to show
  const parametersToShow = showAllParameters 
    ? LAB_PARAMETERS.filter(p => availableParameters.includes(p.name))
    : LAB_PARAMETERS.filter(p => selectedParameters.includes(p.name));

  // Get value for a specific parameter and date group
  const getValue = (parameterName: string, dateGroup: { dates: Date[] }): { value: number | null; unit: string | null; isAbnormal: boolean; count: number } => {
    let totalValue = 0;
    let count = 0;
    let unit: string | null = null;
    
    dateGroup.dates.forEach(date => {
      const dataPoint = labData.find(d => d.date.toDateString() === date.toDateString());
      if (!dataPoint) return;

      const metric = dataPoint.metrics.find(m => m.name === parameterName);
      if (!metric || metric.value === null) return;

      totalValue += metric.value;
      count++;
      unit = metric.unit;
    });

    if (count === 0) return { value: null, unit: null, isAbnormal: false, count: 0 };
    
    const avgValue = totalValue / count;
    const param = LAB_PARAMETERS.find(p => p.name === parameterName);
    
    if (!param) return { value: avgValue, unit, isAbnormal: false, count };
    
    const isAbnormal = avgValue < param.range[0] || avgValue > param.range[1];
    return { value: avgValue, unit, isAbnormal, count };
  };

  // Calculate MELD scores for each date group
  const meldScores = useMemo(() => {
    return dateGroups.map(dateGroup => {
      // Get values for MELD calculation
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
  }, [dateGroups, labData]);

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
      score: 'bg-emerald-50 border-emerald-200 text-emerald-700'
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
                        <div className="text-sm font-semibold text-gray-900">
                          {param.range[0]} - {param.range[1]}
                        </div>
                        {param.unit && (
                          <div className="text-xs text-gray-500 mt-1">
                            {param.unit}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* MELD Score Rows - Only show where we can calculate */}
                {meldScores.some(score => score.canCalculateMELD) && (
                  <>
                    {/* MELD Score Row */}
                    <tr className="bg-emerald-50 hover:bg-emerald-100 border-t-2 border-emerald-300">
                      <td className="sticky left-0 z-10 bg-emerald-50 border-r border-gray-200 px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-emerald-100 border-emerald-300 text-emerald-800">
                            🧮 MELD Score
                          </span>
                          <span className="text-xs text-emerald-600">(Calculated)</span>
                        </div>
                      </td>
                      
                      {dateGroups.map((dateGroup, dateIndex) => {
                        const meldData = meldScores.find(score => score.dateGroup.key === dateGroup.key);
                        
                        return (
                          <td key={dateIndex} className="border-b border-gray-200 px-4 py-4 text-center">
                            {meldData?.canCalculateMELD && meldData.meldScore !== null ? (
                              <div className="space-y-1">
                                <div className="font-bold text-xl text-emerald-800 bg-emerald-100 px-3 py-2 rounded-lg">
                                  {meldData.meldScore}
                                </div>
                                <div className="text-xs text-emerald-600">
                                  Bilirubin: {meldData.parameters.bilirubin?.toFixed(2)} | 
                                  Creatinine: {meldData.parameters.creatinine?.toFixed(2)} | 
                                  INR: {meldData.parameters.inr?.toFixed(2)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </td>
                        );
                      })}
                      
                      <td className="border-b border-gray-200 px-4 py-4 text-center bg-yellow-50">
                        <div className="text-sm font-semibold text-gray-900">
                          6 - 40
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Higher = Worse
                        </div>
                      </td>
                    </tr>

                    {/* MELD-Na Score Row */}
                    <tr className="bg-emerald-50 hover:bg-emerald-100">
                      <td className="sticky left-0 z-10 bg-emerald-50 border-r border-gray-200 px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-emerald-100 border-emerald-300 text-emerald-800">
                            🧮 MELD-Na Score
                          </span>
                          <span className="text-xs text-emerald-600">(With Sodium)</span>
                        </div>
                      </td>
                      
                      {dateGroups.map((dateGroup, dateIndex) => {
                        const meldData = meldScores.find(score => score.dateGroup.key === dateGroup.key);
                        
                        return (
                          <td key={dateIndex} className="border-b border-gray-200 px-4 py-4 text-center">
                            {meldData?.canCalculateMELDNa && meldData.meldNaScore !== null ? (
                              <div className="space-y-1">
                                <div className="font-bold text-xl text-emerald-800 bg-emerald-100 px-3 py-2 rounded-lg">
                                  {meldData.meldNaScore}
                                </div>
                                <div className="text-xs text-emerald-600">
                                  + Sodium: {meldData.parameters.sodium?.toFixed(1)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </td>
                        );
                      })}
                      
                      <td className="border-b border-gray-200 px-4 py-4 text-center bg-yellow-50">
                        <div className="text-sm font-semibold text-gray-900">
                          6 - 40
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Higher = Worse
                        </div>
                      </td>
                    </tr>
                  </>
                )}
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
              <div>Available parameters: {availableParameters.length}</div>
              <div>Date groups: {dateGroups.length}</div>
              <div>Parameters shown: {parametersToShow.length}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

