"use client";

import { useMemo } from 'react';
import { CanonicalMetric } from '@/lib/metrics';

interface MetricCardProps {
  metric: CanonicalMetric;
  value: number;
  unit: string;
  range: { low: number; high: number };
  trend?: 'up' | 'down' | 'stable' | 'unknown';
  lastUpdated?: string;
  dataCount?: number;
  className?: string;
}

export function MetricCard({ 
  metric, 
  value, 
  unit, 
  range, 
  trend = 'unknown',
  lastUpdated,
  dataCount,
  className = ''
}: MetricCardProps) {
  
  const status = useMemo(() => {
    if (value < range.low) return 'low';
    if (value > range.high) return 'high';
    return 'normal';
  }, [value, range]);

  const statusConfig = {
    low: {
      label: 'Below Normal',
      className: 'medical-status-warning',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      icon: '⚠️'
    },
    normal: {
      label: 'Normal',
      className: 'medical-status-normal',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      icon: '✅'
    },
    high: {
      label: 'Above Normal',
      className: 'medical-status-critical',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      icon: '🔴'
    }
  };

  const trendConfig = {
    up: { icon: '↗️', label: 'Increasing', color: 'text-red-600' },
    down: { icon: '↙️', label: 'Decreasing', color: 'text-green-600' },
    stable: { icon: '➡️', label: 'Stable', color: 'text-gray-500' },
    unknown: { icon: '❓', label: 'Unknown', color: 'text-gray-400' }
  };

  const formatValue = (val: number) => {
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'K';
    }
    if (val < 1) {
      return val.toFixed(2);
    }
    if (val < 10) {
      return val.toFixed(1);
    }
    return Math.round(val).toString();
  };

  const currentStatus = statusConfig[status];
  const currentTrend = trendConfig[trend];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-6 transition-all hover:shadow-md hover:border-gray-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{metric}</h3>
          {lastUpdated && (
            <p className="text-sm text-gray-500">
Updated {typeof window !== 'undefined' ? new Date(lastUpdated).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }) : 'Recently'}
            </p>
          )}
        </div>
        <div className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${currentStatus.className}`}>
          <span>{currentStatus.icon} {currentStatus.label}</span>
        </div>
      </div>

      {/* Main Metric Display */}
      <div className="text-center mb-4">
        <div className={`text-3xl font-bold leading-none mb-1 ${currentStatus.textColor}`}>
          {formatValue(value)}
        </div>
        <div className="text-sm text-gray-500 font-medium">
          {unit}
        </div>
      </div>

      {/* Reference Range */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <div className="text-xs text-gray-600 mb-2">
          Normal Range
        </div>
        <div className="text-sm font-medium text-gray-800">
          {range.low} - {range.high} {unit}
        </div>
      </div>

      {/* Footer with Trend and Data Count */}
      <div className="mt-4 flex items-center justify-between">
        <div className={`flex items-center gap-1 text-sm font-medium ${currentTrend.color}`}>
          <span>{currentTrend.icon}</span>
          <span>{currentTrend.label}</span>
        </div>
        {dataCount && (
          <div className="text-xs text-gray-500">
            {dataCount} data points
          </div>
        )}
      </div>
    </div>
  );
}

// Specialized component for critical metrics (MELD components)
export function CriticalMetricCard(props: MetricCardProps) {
  return (
    <MetricCard 
      {...props} 
      className="border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white"
    />
  );
}

// Specialized component for key liver metrics
export function LiverMetricCard(props: MetricCardProps) {
  return (
    <MetricCard 
      {...props} 
      className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white"
    />
  );
}
