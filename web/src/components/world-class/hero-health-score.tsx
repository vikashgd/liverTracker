"use client";

import { useMemo } from 'react';
import { CanonicalMetric } from '@/lib/metrics';

interface HealthData {
  metric: CanonicalMetric;
  value: number;
  unit: string;
  range: { low: number; high: number };
  trend: 'up' | 'down' | 'stable' | 'unknown';
  status: 'normal' | 'warning' | 'critical';
}

interface HeroHealthScoreProps {
  healthData: HealthData[];
  meldScore?: number;
}

export function HeroHealthScore({ healthData, meldScore }: HeroHealthScoreProps) {
  
  // Calculate overall health score (0-100)
  const overallScore = useMemo(() => {
    if (healthData.length === 0) return 0;
    
    const scores = healthData.map(data => {
      const { value, range, status } = data;
      
      // Base score on how close to normal range
      const midpoint = (range.low + range.high) / 2;
      const rangeWidth = range.high - range.low;
      
      let normalizedScore = 100;
      
      if (status === 'normal') {
        // If in normal range, score based on how close to optimal
        const distanceFromMid = Math.abs(value - midpoint);
        const maxDistance = rangeWidth / 2;
        normalizedScore = Math.max(70, 100 - (distanceFromMid / maxDistance) * 30);
      } else if (status === 'warning') {
        // Use deterministic calculation based on how far outside range
        const deviation = Math.min(
          Math.abs(value - range.low) / range.low,
          Math.abs(value - range.high) / range.high
        );
        normalizedScore = Math.max(40, 70 - deviation * 30); // 40-70
      } else {
        // Critical - use deterministic calculation
        const deviation = Math.min(
          Math.abs(value - range.low) / range.low,
          Math.abs(value - range.high) / range.high
        );
        normalizedScore = Math.max(10, 40 - deviation * 30); // 10-40
      }
      
      return Math.round(normalizedScore);
    });
    
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Factor in MELD score if available
    if (meldScore) {
      const meldPenalty = Math.max(0, (meldScore - 6) * 3); // Penalty for MELD > 6
      return Math.max(0, Math.round(avgScore - meldPenalty));
    }
    
    return Math.round(avgScore);
  }, [healthData, meldScore]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return { primary: '#10B981', secondary: '#D1FAE5', text: 'text-emerald-600' };
    if (score >= 60) return { primary: '#F59E0B', secondary: '#FEF3C7', text: 'text-amber-600' };
    return { primary: '#EF4444', secondary: '#FEE2E2', text: 'text-red-600' };
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', icon: '🌟' };
    if (score >= 60) return { label: 'Good', icon: '😊' };
    if (score >= 40) return { label: 'Fair', icon: '😐' };
    return { label: 'Needs Attention', icon: '⚠️' };
  };

  const colors = getScoreColor(overallScore);
  const scoreInfo = getScoreLabel(overallScore);
  
  // Calculate circumference for progress circle
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
      <div className="flex flex-col lg:flex-row items-center gap-8">
        
        {/* Health Score Circle */}
        <div className="relative flex-shrink-0">
          <div className="relative w-48 h-48">
            {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke="#E5E7EB"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress Circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke={colors.primary}
                strokeWidth="12"
                fill="none"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: `drop-shadow(0 0 6px ${colors.primary}40)`
                }}
              />
            </svg>
            
            {/* Score Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-4xl font-bold ${colors.text}`}>
                  {overallScore}
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  Health Score
                </div>
              </div>
            </div>
          </div>
          
          {/* Score Label */}
          <div className="text-center mt-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${colors.text}`} 
                 style={{ backgroundColor: colors.secondary }}>
              <span className="text-lg">{scoreInfo.icon}</span>
              {scoreInfo.label}
            </div>
          </div>
        </div>

        {/* Health Insights */}
        <div className="flex-1 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your Liver Health Overview
            </h2>
            <p className="text-gray-600">
              {overallScore >= 80 
                ? "Your liver function is excellent! Keep up the great work with your current lifestyle."
                : overallScore >= 60
                ? "Your liver health is good overall. A few metrics could use attention."
                : overallScore >= 40
                ? "Your liver health is fair. Consider discussing these results with your doctor."
                : "Your liver health needs attention. Please consult with your healthcare provider."
              }
            </p>
          </div>

          {/* Key Metrics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {healthData.slice(0, 4).map((data) => {
              const statusColors = {
                normal: 'bg-green-50 text-green-700 border-green-200',
                warning: 'bg-amber-50 text-amber-700 border-amber-200',
                critical: 'bg-red-50 text-red-700 border-red-200'
              };
              
              return (
                <div key={data.metric} 
                     className={`p-3 rounded-lg border ${statusColors[data.status]}`}>
                  <div className="text-xs font-medium opacity-75 mb-1">
                    {data.metric}
                  </div>
                  <div className="text-lg font-bold">
                    {data.value} {data.unit}
                  </div>
                  <div className="text-xs capitalize">
                    {data.status}
                  </div>
                </div>
              );
            })}
          </div>

          {/* MELD Score if available */}
          {meldScore && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-purple-900">MELD Score</h3>
                  <p className="text-sm text-purple-700">
                    Model for End-Stage Liver Disease
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-900">
                    {meldScore}
                  </div>
                  <div className="text-sm text-purple-700">
                    {meldScore <= 9 ? 'Low Risk' : 
                     meldScore <= 19 ? 'Medium Risk' : 
                     meldScore <= 29 ? 'High Risk' : 'Critical Risk'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => window.location.href = '/reports'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              📄 Upload New Report
            </button>
            <button 
              onClick={() => window.location.href = '/manual-entry'}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              ✍️ Manual Entry
            </button>
            <button 
              onClick={() => {
                const trendsSection = document.querySelector('[data-section="trends"]');
                if (trendsSection) {
                  trendsSection.scrollIntoView({ behavior: 'smooth' });
                } else {
                  // Fallback: scroll to bottom of page where charts are
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }
              }}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              📊 View Trends
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
