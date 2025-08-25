"use client";

import { useMemo } from 'react';
import { CanonicalMetric } from '@/lib/metrics';
import { formatMedicalValue } from '@/lib/medical-display-formatter';

interface PremiumMetricCardProps {
  metric: CanonicalMetric;
  value: number;
  unit: string;
  range: { low: number; high: number };
  trend?: 'up' | 'down' | 'stable' | 'unknown';
  lastUpdated?: string;
  dataCount?: number;
  className?: string;
  priority?: 'critical' | 'liver' | 'standard' | 'high' | 'medium' | 'low';
}

export function PremiumMetricCard({ 
  metric, 
  value, 
  unit, 
  range, 
  trend = 'unknown',
  lastUpdated,
  dataCount,
  className = '',
  priority = 'standard'
}: PremiumMetricCardProps) {
  
  const status = useMemo(() => {
    if (value < range.low) return 'low';
    if (value > range.high) return 'high';
    return 'normal';
  }, [value, range]);

  const statusConfig = {
    low: {
      label: 'Below Normal',
      bgGradient: 'from-amber-50 to-orange-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-800',
      valueColor: 'text-amber-900',
      icon: '⚠️',
      iconBg: 'bg-amber-100',
      barColor: 'bg-amber-400'
    },
    normal: {
      label: 'Normal',
      bgGradient: 'from-emerald-50 to-green-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-800',
      valueColor: 'text-emerald-900',
      icon: '✅',
      iconBg: 'bg-emerald-100',
      barColor: 'bg-emerald-400'
    },
    high: {
      label: 'Above Normal',
      bgGradient: 'from-red-50 to-rose-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      valueColor: 'text-red-900',
      icon: '🔴',
      iconBg: 'bg-red-100',
      barColor: 'bg-red-400'
    }
  };

  const trendConfig = {
    up: { icon: '↗️', label: 'Increasing', color: 'text-red-600', bg: 'bg-red-50' },
    down: { icon: '↙️', label: 'Decreasing', color: 'text-green-600', bg: 'bg-green-50' },
    stable: { icon: '➡️', label: 'Stable', color: 'text-blue-600', bg: 'bg-blue-50' },
    unknown: { icon: '❓', label: 'Unknown', color: 'text-gray-500', bg: 'bg-gray-50' }
  };

  const priorityConfig = {
    critical: { ring: 'ring-2 ring-red-300', shadow: 'shadow-xl' },
    liver: { ring: 'ring-2 ring-purple-300', shadow: 'shadow-lg' },
    standard: { ring: 'ring-1 ring-blue-200', shadow: 'shadow-md' },
    high: { ring: 'ring-1 ring-purple-200', shadow: 'shadow-lg' },
    medium: { ring: 'ring-1 ring-blue-100', shadow: 'shadow-md' },
    low: { ring: '', shadow: 'shadow-sm' }
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

  // Calculate progress bar position
  const progressPercent = useMemo(() => {
    const rangeWidth = range.high - range.low;
    const extendedLow = range.low - rangeWidth * 0.2;
    const extendedHigh = range.high + rangeWidth * 0.2;
    const extendedWidth = extendedHigh - extendedLow;
    
    const position = ((value - extendedLow) / extendedWidth) * 100;
    return Math.max(0, Math.min(100, position));
  }, [value, range]);

  const currentStatus = statusConfig[status];
  const currentTrend = trendConfig[trend];
  const currentPriority = priorityConfig[priority];

  return (
    <div className={`
      relative bg-gradient-to-br ${currentStatus.bgGradient} 
      rounded-2xl border ${currentStatus.borderColor} 
      ${currentPriority.shadow} ${currentPriority.ring}
      p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
      ${className}
    `}>
      
      {/* Priority Indicator */}
      {priority === 'critical' && (
        <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${currentStatus.iconBg} rounded-xl flex items-center justify-center`}>
            <span className="text-lg">{currentStatus.icon}</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{metric}</h3>
            {lastUpdated && (
              <p className="text-xs text-gray-500">
{typeof window !== 'undefined' ? new Date(lastUpdated).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                }) : 'Recently'}
              </p>
            )}
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${currentStatus.textColor} ${currentStatus.iconBg}`}>
          {currentStatus.label}
        </div>
      </div>

      {/* Main Value Display */}
      <div className="text-center mb-6">
        <div className={`text-5xl font-black leading-none mb-2 ${currentStatus.valueColor}`}>
          {(() => {
            const formatted = formatMedicalValue(metric, value, unit);
            const displayValue = formatted.displayValue;
            // Apply the same formatting logic for large numbers
            if (displayValue >= 1000) {
              return (displayValue / 1000).toFixed(1) + 'K';
            }
            return displayValue.toString();
          })()}
        </div>
        <div className="text-lg text-gray-600 font-medium">
          {(() => {
            const formatted = formatMedicalValue(metric, value, unit);
            return formatted.displayUnit;
          })()}
        </div>
        
        {/* Conversion Message */}
        {(() => {
          const formatted = formatMedicalValue(metric, value, unit);
          if (formatted.wasConverted && formatted.conversionNote) {
            return (
              <div className="mt-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <span>🔧</span>
                  <span className="font-medium">Unit Converted:</span>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {formatted.conversionNote}
                </div>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Progress Bar Visualization */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>{range.low}</span>
          <span className="font-medium">Normal Range</span>
          <span>{range.high}</span>
        </div>
        
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          {/* Normal range background */}
          <div 
            className="absolute h-full bg-green-200 rounded-full"
            style={{ 
              left: '20%', 
              width: '60%' 
            }}
          ></div>
          
          {/* Current value indicator */}
          <div 
            className={`absolute h-full w-2 ${currentStatus.barColor} rounded-full transition-all duration-700 ease-out`}
            style={{ 
              left: `${Math.max(0, progressPercent - 1)}%`,
              boxShadow: `0 0 8px ${currentStatus.barColor.replace('bg-', '')}`
            }}
          ></div>
        </div>
        
        <div className="flex justify-center mt-2">
          <div className="text-xs text-gray-600">
            Current: <span className={`font-semibold ${currentStatus.textColor}`}>
              {(() => {
                const formatted = formatMedicalValue(metric, value, unit);
                return `${formatted.displayValue} ${formatted.displayUnit}`;
              })()}
            </span>
            {(() => {
              const formatted = formatMedicalValue(metric, value, unit);
              if (formatted.wasConverted) {
                return (
                  <span className="ml-2 text-blue-600 font-medium">
                    (converted)
                  </span>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>

      {/* Footer with Trend and Stats */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${currentTrend.color} ${currentTrend.bg}`}>
          <span>{currentTrend.icon}</span>
          <span>{currentTrend.label}</span>
        </div>
        
        {dataCount && (
          <div className="text-xs text-gray-500 bg-white bg-opacity-50 px-2 py-1 rounded-full">
            {dataCount} readings
          </div>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-white bg-opacity-0 hover:bg-opacity-5 rounded-2xl transition-all duration-300 pointer-events-none"></div>
    </div>
  );
}

// Specialized components for different metric types
export function CriticalPremiumCard(props: PremiumMetricCardProps) {
  return <PremiumMetricCard {...props} priority="critical" />;
}

export function HighPriorityCard(props: PremiumMetricCardProps) {
  return <PremiumMetricCard {...props} priority="high" />;
}
