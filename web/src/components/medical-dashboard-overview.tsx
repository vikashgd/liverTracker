"use client";

import { useMemo } from 'react';
import { MetricCard, CriticalMetricCard, LiverMetricCard } from './ui/metric-card';
import { CanonicalMetric, referenceRanges } from '@/lib/metrics';

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

interface MedicalDashboardOverviewProps {
  charts: ChartSpec[];
}

export function MedicalDashboardOverview({ charts }: MedicalDashboardOverviewProps) {
  
  // Calculate MELD score if we have the required metrics
  const meldScore = useMemo(() => {
    const bilirubinChart = charts.find(c => c.title === 'Bilirubin');
    const creatinineChart = charts.find(c => c.title === 'Creatinine');
    const inrChart = charts.find(c => c.title === 'INR');
    
    const bilirubin = bilirubinChart?.data.filter(d => d.value !== null).pop()?.value;
    const creatinine = creatinineChart?.data.filter(d => d.value !== null).pop()?.value;
    const inr = inrChart?.data.filter(d => d.value !== null).pop()?.value;

    if (bilirubin && creatinine && inr) {
      // MELD Score calculation
      const meld = Math.round(
        3.78 * Math.log(bilirubin) + 
        11.2 * Math.log(inr) + 
        9.57 * Math.log(creatinine) + 
        6.43
      );
      return Math.max(6, Math.min(40, meld)); // MELD is capped between 6-40
    }
    return null;
  }, [charts]);

  // Categorize metrics
  const meldMetrics = charts.filter(c => ['Bilirubin', 'Creatinine', 'INR'].includes(c.title));
  const liverMetrics = charts.filter(c => ['ALT', 'AST', 'ALP', 'GGT', 'Albumin', 'TotalProtein'].includes(c.title));
  const otherMetrics = charts.filter(c => ['Platelets', 'Sodium', 'Potassium'].includes(c.title));

  const calculateTrend = (data: SeriesPoint[]) => {
    const validData = data.filter(d => d.value !== null);
    if (validData.length < 2) return 'unknown';
    
    const recent = validData.slice(-3); // Last 3 points
    if (recent.length < 2) return 'unknown';
    
    const firstValue = recent[0].value!;
    const lastValue = recent[recent.length - 1].value!;
    const trend = lastValue - firstValue;
    const threshold = Math.abs(firstValue * 0.1); // 10% change threshold
    
    if (Math.abs(trend) < threshold) return 'stable';
    return trend > 0 ? 'up' : 'down';
  };

  const getMeldScoreStatus = (score: number) => {
    if (score <= 9) return { label: 'Low Risk', color: 'text-green-600', bg: 'bg-green-50' };
    if (score <= 19) return { label: 'Medium Risk', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (score <= 29) return { label: 'High Risk', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { label: 'Critical Risk', color: 'text-red-600', bg: 'bg-red-50' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-8">
      
      {/* MELD Score Banner */}
      {meldScore && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                🎯 MELD Score
              </h2>
              <p className="text-sm text-gray-600">
                Model for End-Stage Liver Disease
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {meldScore}
              </div>
              <div className={`text-sm font-medium px-3 py-1 rounded-full ${getMeldScoreStatus(meldScore).bg} ${getMeldScoreStatus(meldScore).color}`}>
                {getMeldScoreStatus(meldScore).label}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Critical MELD Parameters */}
      {meldMetrics.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            🎯 MELD Score Components
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {meldMetrics.map(chart => {
              const latestData = chart.data.filter(d => d.value !== null).pop();
              if (!latestData || latestData.value === null) return null;
              
              return (
                <CriticalMetricCard
                  key={chart.title}
                  metric={chart.title}
                  value={latestData.value}
                  unit={chart.unit}
                  range={chart.range}
                  trend={calculateTrend(chart.data)}
                  lastUpdated={latestData.date}
                  dataCount={chart.data.filter(d => d.value !== null).length}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Liver Function Tests */}
      {liverMetrics.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            🧪 Liver Function Tests
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {liverMetrics.map(chart => {
              const latestData = chart.data.filter(d => d.value !== null).pop();
              if (!latestData || latestData.value === null) return null;
              
              return (
                <LiverMetricCard
                  key={chart.title}
                  metric={chart.title}
                  value={latestData.value}
                  unit={chart.unit}
                  range={chart.range}
                  trend={calculateTrend(chart.data)}
                  lastUpdated={latestData.date}
                  dataCount={chart.data.filter(d => d.value !== null).length}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Other Important Metrics */}
      {otherMetrics.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            📊 Additional Markers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherMetrics.map(chart => {
              const latestData = chart.data.filter(d => d.value !== null).pop();
              if (!latestData || latestData.value === null) return null;
              
              return (
                <MetricCard
                  key={chart.title}
                  metric={chart.title}
                  value={latestData.value}
                  unit={chart.unit}
                  range={chart.range}
                  trend={calculateTrend(chart.data)}
                  lastUpdated={latestData.date}
                  dataCount={chart.data.filter(d => d.value !== null).length}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 bg-gradient-to-r from-blue-50 to-white">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📋 Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <a href="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
            📄 Upload Report
          </a>
          <a href="/manual-entry" className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm">
            ✍️ Manual Entry
          </a>
          <a href="/reports" className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm">
            🗂️ View All Reports
          </a>
          <a href="/timeline" className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm">
            📅 Timeline View
          </a>
        </div>
      </section>
    </div>
  );
}
