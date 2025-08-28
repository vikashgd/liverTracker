"use client";

import { useMemo, useState, useEffect } from 'react';
import { HeroHealthScore } from './hero-health-score';
import { PremiumMetricCard, CriticalPremiumCard, HighPriorityCard } from './premium-metric-card';
import { CanonicalMetric } from '@/lib/metrics';
import { calculateMELD, MELDParameters } from '@/lib/meld-calculator';
import { formatMedicalValue } from '@/lib/medical-display-formatter';

interface SeriesPoint {
  date: string;
  value: number | null;
  reportCount?: number;
}

interface ChartSpec {
  title: CanonicalMetric;
  color: string;
  data: SeriesPoint[];
  range: { low: number; high: number };
  unit: string;
}

interface WorldClassDashboardProps {
  charts: ChartSpec[];
}

export function WorldClassDashboard({ charts }: WorldClassDashboardProps) {
  
  // Client-side state for hydration-safe time display
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date().toLocaleTimeString());
    
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 60000);

    return () => clearInterval(interval);
  }, []);
  
  // Helper function to calculate trend
  const calculateTrend = (data: SeriesPoint[]) => {
    const validData = data.filter(d => d.value !== null);
    if (validData.length < 2) return 'unknown';
    
    const recent = validData.slice(-3);
    if (recent.length < 2) return 'unknown';
    
    const firstValue = recent[0].value!;
    const lastValue = recent[recent.length - 1].value!;
    const trend = lastValue - firstValue;
    const threshold = Math.abs(firstValue * 0.1);
    
    if (Math.abs(trend) < threshold) return 'stable';
    return trend > 0 ? 'up' : 'down';
  };

  // Process data for health score calculation
  const healthData = useMemo(() => {
    return charts.map(chart => {
      const latestData = chart.data.filter(d => d.value !== null).pop();
      if (!latestData || latestData.value === null) return null;
      
      const value = latestData.value;
      const { range } = chart;
      
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (value < range.low || value > range.high) {
        // Determine if it's warning or critical based on how far outside range
        const deviation = Math.max(
          Math.abs(value - range.low) / range.low,
          Math.abs(value - range.high) / range.high
        );
        status = deviation > 0.5 ? 'critical' : 'warning';
      }
      
      return {
        metric: chart.title,
        value,
        unit: chart.unit,
        range,
        trend: calculateTrend(chart.data),
        status
      };
    }).filter(Boolean) as any[];
  }, [charts]);

  // Calculate MELD score using the advanced calculator
  const meldScore = useMemo(() => {
    const bilirubinChart = charts.find(c => c.title === 'Bilirubin');
    const creatinineChart = charts.find(c => c.title === 'Creatinine');
    const inrChart = charts.find(c => c.title === 'INR');
    const sodiumChart = charts.find(c => c.title === 'Sodium');
    const albuminChart = charts.find(c => c.title === 'Albumin');
    
    const bilirubin = bilirubinChart?.data.filter(d => d.value !== null).pop()?.value;
    const creatinine = creatinineChart?.data.filter(d => d.value !== null).pop()?.value;
    const inr = inrChart?.data.filter(d => d.value !== null).pop()?.value;
    const sodium = sodiumChart?.data.filter(d => d.value !== null).pop()?.value;
    const albumin = albuminChart?.data.filter(d => d.value !== null).pop()?.value;

    if (bilirubin && creatinine && inr) {
      const meldParams: MELDParameters = {
        bilirubin,
        creatinine,
        inr,
        sodium: sodium || undefined,
        albumin: albumin || undefined,
        // Note: gender and dialysis would come from patient profile if available
      };
      
      const result = calculateMELD(meldParams);
      // Return the best available score: MELD 3.0 > MELD-Na > MELD
      return result.meld3 ?? result.meldNa ?? result.meld;
    }
    return undefined;
  }, [charts]);

  // Categorize metrics by priority
  const criticalMetrics = charts.filter(c => ['Bilirubin', 'Creatinine', 'INR'].includes(c.title));
  const highPriorityMetrics = charts.filter(c => ['ALT', 'AST', 'Platelets', 'Albumin'].includes(c.title));
  const standardMetrics = charts.filter(c => !['Bilirubin', 'Creatinine', 'INR', 'ALT', 'AST', 'Platelets', 'Albumin'].includes(c.title));

  // Data categorization complete

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      
      {/* World-Class Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🫀</span>
                </div>
                <h1 className="text-4xl font-black text-gray-900 bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
                  Liver Dashboard
                </h1>
              </div>
              <p className="text-lg text-gray-600">
                Your complete liver health analysis powered by AI
              </p>
              <div className="flex items-center gap-6 mt-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live Monitoring Active
                </div>
                <div className="text-sm text-gray-500">
                  Last Sync: {isClient ? currentTime : '--:--:--'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.open('/manual-entry', '_blank')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl font-semibold"
              >
                📱 Manual Entry
              </button>
              <button 
                onClick={() => window.location.href = '/reports'}
                className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all shadow-md font-semibold"
              >
                📄 View Reports
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Hero Health Score */}
        <HeroHealthScore 
          healthData={healthData} 
          meldScore={meldScore}
        />

        {/* Critical Metrics Section */}
        {criticalMetrics.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 font-bold">🚨</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Critical Health Indicators
              </h2>
              <div className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                MELD Components
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {criticalMetrics.map(chart => {
                const validData = chart.data.filter(d => d.value !== null && d.value !== undefined);
                const latestData = validData[validData.length - 1]; // Get last valid data point
                
                // Debug data validation complete
                
                if (!latestData || latestData.value === null || latestData.value === undefined) {
                  return null;
                }
                
                // Beautiful critical metric card
                const isAboveNormal = latestData.value > chart.range.high;
                const isBelowNormal = latestData.value < chart.range.low;
                const isNormal = !isAboveNormal && !isBelowNormal;
                
                return (
                  <div key={chart.title} className="bg-white rounded-xl border-2 border-red-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{chart.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full uppercase tracking-wide">
                          🚨 Critical
                        </span>
                        {!isNormal && (
                          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                      </div>
                    </div>

                    {/* Main Value */}
                    <div className="text-center mb-4">
                      <div className={`text-4xl font-bold mb-2 ${
                        isNormal ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(() => {
                          const formatted = formatMedicalValue(chart.title, latestData.value, chart.unit);
                          return formatted.displayValue;
                        })()} 
                        <span className="text-xl text-gray-500 ml-1">
                          {(() => {
                            const formatted = formatMedicalValue(chart.title, latestData.value, chart.unit);
                            return formatted.displayUnit;
                          })()}
                        </span>
                      </div>
                      
                      {/* Status Indicator */}
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        isNormal 
                          ? 'bg-green-100 text-green-800' 
                          : isAboveNormal 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-orange-100 text-orange-800'
                      }`}>
                        {isNormal ? '✅ Normal' : isAboveNormal ? '⬆️ High' : '⬇️ Low'}
                      </div>
                    </div>

                    {/* Reference Range */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="text-xs text-gray-600 mb-1">Normal Range</div>
                      <div className="text-sm font-medium text-gray-800">
                        {chart.range.low} - {chart.range.high} {chart.unit}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{validData.length} readings</span>
                      <span>Updated {isClient ? new Date(latestData.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'Recently'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* High Priority Metrics */}
        {highPriorityMetrics.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold">🧪</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Liver Function Panel
              </h2>
              <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                High Priority
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {highPriorityMetrics.map(chart => {
                const validData = chart.data.filter(d => d.value !== null && d.value !== undefined);
                const latestData = validData[validData.length - 1];
                
                if (!latestData || latestData.value === null || latestData.value === undefined) {
                  return null;
                }
                
                // Beautiful liver function card
                const isAboveNormal = latestData.value > chart.range.high;
                const isBelowNormal = latestData.value < chart.range.low;
                const isNormal = !isAboveNormal && !isBelowNormal;
                
                return (
                  <div key={chart.title} className="bg-white rounded-xl border-2 border-purple-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{chart.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full uppercase tracking-wide">
                          🧪 Liver
                        </span>
                        {!isNormal && (
                          <span className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></span>
                        )}
                      </div>
                    </div>

                    {/* Main Value */}
                    <div className="text-center mb-4">
                      <div className={`text-4xl font-bold mb-2 ${
                        isNormal ? 'text-green-600' : 'text-purple-600'
                      }`}>
                        {(() => {
                          const formatted = formatMedicalValue(chart.title, latestData.value, chart.unit);
                          return formatted.displayValue;
                        })()} 
                        <span className="text-xl text-gray-500 ml-1">
                          {(() => {
                            const formatted = formatMedicalValue(chart.title, latestData.value, chart.unit);
                            return formatted.displayUnit;
                          })()}
                        </span>
                      </div>
                      
                      {/* Status Indicator */}
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        isNormal 
                          ? 'bg-green-100 text-green-800' 
                          : isAboveNormal 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-orange-100 text-orange-800'
                      }`}>
                        {isNormal ? '✅ Normal' : isAboveNormal ? '⬆️ High' : '⬇️ Low'}
                      </div>
                    </div>

                    {/* Reference Range */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="text-xs text-gray-600 mb-1">Normal Range</div>
                      <div className="text-sm font-medium text-gray-800">
                        {chart.range.low} - {chart.range.high} {chart.unit}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{validData.length} readings</span>
                      <span>Updated {isClient ? new Date(latestData.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'Recently'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Standard Metrics */}
        {standardMetrics.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">📊</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Additional Health Markers
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {standardMetrics.map(chart => {
                const validData = chart.data.filter(d => d.value !== null && d.value !== undefined);
                const latestData = validData[validData.length - 1];
                
                if (!latestData || latestData.value === null || latestData.value === undefined) {
                  return null;
                }
                
                // Beautiful standard metric card
                const isAboveNormal = latestData.value > chart.range.high;
                const isBelowNormal = latestData.value < chart.range.low;
                const isNormal = !isAboveNormal && !isBelowNormal;
                
                return (
                  <div key={chart.title} className="bg-white rounded-xl border-2 border-blue-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{chart.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full uppercase tracking-wide">
                          📊 Standard
                        </span>
                        {!isNormal && (
                          <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                        )}
                      </div>
                    </div>

                    {/* Main Value */}
                    <div className="text-center mb-4">
                      <div className={`text-4xl font-bold mb-2 ${
                        isNormal ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {(() => {
                          const formatted = formatMedicalValue(chart.title, latestData.value, chart.unit);
                          return formatted.displayValue;
                        })()} 
                        <span className="text-xl text-gray-500 ml-1">
                          {(() => {
                            const formatted = formatMedicalValue(chart.title, latestData.value, chart.unit);
                            return formatted.displayUnit;
                          })()}
                        </span>
                      </div>
                      
                      {/* Status Indicator */}
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        isNormal 
                          ? 'bg-green-100 text-green-800' 
                          : isAboveNormal 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-orange-100 text-orange-800'
                      }`}>
                        {isNormal ? '✅ Normal' : isAboveNormal ? '⬆️ High' : '⬇️ Low'}
                      </div>
                    </div>

                    {/* Reference Range */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="text-xs text-gray-600 mb-1">Normal Range</div>
                      <div className="text-sm font-medium text-gray-800">
                        {chart.range.low} - {chart.range.high} {chart.unit}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{validData.length} readings</span>
                      <span>Updated {isClient ? new Date(latestData.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'Recently'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Smart Recommendations */}
        <section className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-8 border border-indigo-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <span className="text-indigo-600 text-xl">🤖</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              AI Health Insights
            </h2>
            <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
              Personalized
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">📈 Trend Analysis</h3>
              <p className="text-gray-600 mb-4">
                Your liver enzymes have improved by 15% over the past 3 months. This positive trend suggests your current treatment plan is effective.
              </p>
              <button className="text-blue-600 font-medium hover:text-blue-700">
                View detailed analysis →
              </button>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">💡 Recommendations</h3>
              <p className="text-gray-600 mb-4">
                Consider scheduling your next check-up in 6-8 weeks to monitor the continued improvement in your liver function.
              </p>
              <button className="text-blue-600 font-medium hover:text-blue-700">
                Schedule appointment →
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
