"use client";

import { useState, useEffect, useCallback } from 'react';
import { calculateMELD, MELDParameters, MELDResult, extractMELDParameters } from '@/lib/meld-calculator';
import { CanonicalMetric } from '@/lib/metrics';
import { MELDParameterForm } from './meld-parameter-form';
import { PatientProfile } from '@/lib/ai-health-intelligence';

interface MELDIntelligenceProps {
  charts: Array<{
    title: CanonicalMetric;
    data: Array<{ date: string; value: number | null; reportCount?: number }>;
    unit: string;
  }>;
  patientProfile?: PatientProfile;
  onProfileUpdate?: (profile: PatientProfile) => void;
}

export function MELDIntelligence({ charts, patientProfile, onProfileUpdate }: MELDIntelligenceProps) {
  const [meldResult, setMeldResult] = useState<MELDResult | null>(null);
  const [meldHistory, setMeldHistory] = useState<Array<{ date: string; meld: number; meldNa?: number; meld3?: number }>>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      calculateCurrentMELD();
      calculateMELDHistory();
    }
  }, [isClient, calculateCurrentMELD, calculateMELDHistory]);

  const calculateCurrentMELD = useCallback(() => {
    // Get latest values for MELD calculation
    const getLatestValue = (metric: CanonicalMetric) => {
      const chart = charts.find(c => c.title === metric);
      if (!chart) return null;
      const validData = chart.data.filter(d => d.value !== null);
      return validData.length > 0 ? validData[validData.length - 1] : null;
    };

    const bilirubin = getLatestValue('Bilirubin');
    const creatinine = getLatestValue('Creatinine');
    const inr = getLatestValue('INR');
    const sodium = getLatestValue('Sodium');
    const albumin = getLatestValue('Albumin');

    if (!bilirubin || !creatinine || !inr) {
      setMeldResult(null);
      return;
    }

    const meldParams: MELDParameters = {
      bilirubin: bilirubin.value!,
      creatinine: creatinine.value!,
      inr: inr.value!,
      sodium: sodium?.value,
      albumin: albumin?.value,
      gender: patientProfile?.gender,
      dialysis: patientProfile?.dialysis
    };

    const result = calculateMELD(meldParams);
    setMeldResult(result);
  }, [charts, patientProfile]);

  const calculateMELDHistory = useCallback(() => {
    // Calculate MELD scores for all time points where we have complete data
    const allDates = new Set<string>();
    charts.forEach(chart => {
      chart.data.forEach(point => {
        if (point.value !== null) allDates.add(point.date);
      });
    });

    const history: Array<{ date: string; meld: number; meldNa?: number; meld3?: number }> = [];

    Array.from(allDates).sort().forEach(date => {
      const getValueForDate = (metric: CanonicalMetric) => {
        const chart = charts.find(c => c.title === metric);
        return chart?.data.find(d => d.date === date && d.value !== null)?.value || null;
      };

      const bilirubin = getValueForDate('Bilirubin');
      const creatinine = getValueForDate('Creatinine');
      const inr = getValueForDate('INR');
      const sodium = getValueForDate('Sodium');
      const albumin = getValueForDate('Albumin');

      if (bilirubin && creatinine && inr) {
        const meldParams: MELDParameters = {
          bilirubin,
          creatinine,
          inr,
          sodium: sodium || undefined,
          albumin: albumin || undefined,
          gender: patientProfile?.gender,
          dialysis: patientProfile?.dialysis
        };

        const result = calculateMELD(meldParams);
        history.push({
          date,
          meld: result.meld,
          meldNa: result.meldNa,
          meld3: result.meld3
        });
      }
    });

    setMeldHistory(history);
  }, [charts, patientProfile]);

  const getMELDTrend = () => {
    if (meldHistory.length < 2) return null;
    
    const recent = meldHistory.slice(-3);
    const primaryScores = recent.map(h => h.meld3 || h.meldNa || h.meld);
    
    if (primaryScores.length < 2) return null;
    
    const trend = primaryScores[primaryScores.length - 1] - primaryScores[0];
    return {
      direction: trend > 1 ? 'increasing' : trend < -1 ? 'decreasing' : 'stable',
      change: Math.abs(trend),
      timespan: recent.length
    };
  };

  const getScoreColor = (score: number) => {
    if (score <= 9) return 'text-green-600';
    if (score <= 19) return 'text-yellow-600';
    if (score <= 29) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score <= 9) return 'bg-green-50 border-green-200';
    if (score <= 19) return 'bg-yellow-50 border-yellow-200';
    if (score <= 29) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  if (!isClient) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!meldResult) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <span className="text-4xl">🏥</span>
          <h3 className="text-lg font-semibold text-gray-800 mt-2">MELD Score Calculation</h3>
          <p className="text-gray-600 mt-1">
            Missing required parameters: Bilirubin, Creatinine, and INR are needed for MELD calculation.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <p>💡 Upload lab reports containing these values to see your MELD score and trends.</p>
          </div>
        </div>
      </div>
    );
  }

  const primaryScore = meldResult.meld3 || meldResult.meldNa || meldResult.meld;
  const scoreType = meldResult.meld3 ? 'MELD 3.0' : meldResult.meldNa ? 'MELD-Na' : 'MELD';
  const trend = getMELDTrend();

  return (
    <div className="space-y-6">
      {/* MELD Parameter Collection */}
      {onProfileUpdate && (
        <MELDParameterForm
          currentProfile={patientProfile}
          onProfileUpdate={onProfileUpdate}
          missingParameters={meldResult?.missingParameters || []}
        />
      )}

      {/* Main MELD Score Display */}
      <div className={`rounded-lg border p-6 ${getScoreBackground(primaryScore)}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">🏥 MELD Score Analysis</h3>
            <p className="text-sm text-gray-600 mt-1">
              Model for End-Stage Liver Disease Score
            </p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(primaryScore)}`}>
              {primaryScore}
            </div>
            <div className="text-sm text-gray-600">{scoreType}</div>
            {trend && (
              <div className="flex items-center mt-1">
                {trend.direction === 'increasing' ? '📈' : trend.direction === 'decreasing' ? '📉' : '📊'}
                <span className="text-xs ml-1">{trend.direction}</span>
              </div>
            )}
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded p-3">
            <div className="text-sm text-gray-600">MELD (Basic)</div>
            <div className={`text-2xl font-semibold ${getScoreColor(meldResult.meld)}`}>
              {meldResult.meld}
            </div>
          </div>
          {meldResult.meldNa && (
            <div className="bg-white rounded p-3">
              <div className="text-sm text-gray-600">MELD-Na</div>
              <div className={`text-2xl font-semibold ${getScoreColor(meldResult.meldNa)}`}>
                {meldResult.meldNa}
              </div>
            </div>
          )}
          {meldResult.meld3 && (
            <div className="bg-white rounded p-3 border-2 border-blue-500">
              <div className="text-sm text-blue-600 font-medium">MELD 3.0 (Latest)</div>
              <div className={`text-2xl font-semibold ${getScoreColor(meldResult.meld3)}`}>
                {meldResult.meld3}
              </div>
            </div>
          )}
        </div>

        {/* Interpretation */}
        <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
          <h4 className="font-semibold text-gray-800 mb-2">Clinical Interpretation</h4>
          <p className="text-sm text-gray-700 mb-2">{meldResult.interpretation}</p>
          <p className="text-sm text-blue-800 font-medium">{meldResult.transplantPriority}</p>
        </div>
      </div>

      {/* Warnings and Adjustments */}
      {(meldResult.warnings.length > 0 || meldResult.missingParameters.length > 0) && (
        <div className="space-y-3">
          {/* Warnings */}
          {meldResult.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Calculation Notes</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {meldResult.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span>•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Parameters */}
          {meldResult.missingParameters.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">💡 Improve Accuracy</h4>
              <p className="text-sm text-blue-700 mb-2">
                Provide these additional parameters for more accurate MELD calculation:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                {meldResult.missingParameters.map((param, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span>•</span>
                    <span>{param}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confidence Indicator */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Calculation Confidence</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                meldResult.confidence === 'high' ? 'bg-green-100 text-green-800' :
                meldResult.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {meldResult.confidence.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MELD History Chart */}
      {meldHistory.length > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-800 mb-4">📈 MELD Score History</h4>
          
          {/* Simple trend visualization */}
          <div className="h-32 relative mb-4">
            <svg className="w-full h-full">
              <defs>
                <linearGradient id="meldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.1 }} />
                </linearGradient>
              </defs>
              
              {/* Background grid */}
              <g className="opacity-20">
                {[0, 25, 50, 75, 100].map(y => (
                  <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#d1d5db" strokeWidth="1" />
                ))}
              </g>
              
              {/* MELD trend line */}
              <path
                d={meldHistory.map((point, index) => {
                  const x = (index / (meldHistory.length - 1)) * 100;
                  const score = point.meld3 || point.meldNa || point.meld;
                  const y = 100 - (score / 40) * 100; // Assuming max MELD of 40
                  return `${index === 0 ? 'M' : 'L'} ${x}% ${Math.max(5, Math.min(95, y))}%`;
                }).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Data points */}
              {meldHistory.map((point, index) => {
                const x = (index / (meldHistory.length - 1)) * 100;
                const score = point.meld3 || point.meldNa || point.meld;
                const y = 100 - (score / 40) * 100;
                return (
                  <circle
                    key={index}
                    cx={`${x}%`}
                    cy={`${Math.max(5, Math.min(95, y))}%`}
                    r="4"
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          </div>

          {/* History Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">MELD</th>
                  {meldHistory.some(h => h.meldNa) && <th className="px-3 py-2 text-left">MELD-Na</th>}
                  {meldHistory.some(h => h.meld3) && <th className="px-3 py-2 text-left">MELD 3.0</th>}
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {meldHistory.slice(-10).reverse().map((point, index) => {
                  const primaryScore = point.meld3 || point.meldNa || point.meld;
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        {isClient && new Date(point.date).toLocaleDateString()}
                      </td>
                      <td className={`px-3 py-2 font-medium ${getScoreColor(point.meld)}`}>
                        {point.meld}
                      </td>
                      {meldHistory.some(h => h.meldNa) && (
                        <td className={`px-3 py-2 font-medium ${point.meldNa ? getScoreColor(point.meldNa) : 'text-gray-400'}`}>
                          {point.meldNa || '—'}
                        </td>
                      )}
                      {meldHistory.some(h => h.meld3) && (
                        <td className={`px-3 py-2 font-medium ${point.meld3 ? getScoreColor(point.meld3) : 'text-gray-400'}`}>
                          {point.meld3 || '—'}
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          primaryScore <= 9 ? 'bg-green-100 text-green-800' :
                          primaryScore <= 19 ? 'bg-yellow-100 text-yellow-800' :
                          primaryScore <= 29 ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {primaryScore <= 9 ? 'Low Risk' :
                           primaryScore <= 19 ? 'Medium Risk' :
                           primaryScore <= 29 ? 'High Risk' : 'Critical'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
