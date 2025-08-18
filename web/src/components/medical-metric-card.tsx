"use client";

import { ReactNode } from 'react';

interface MedicalMetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  status?: 'normal' | 'abnormal' | 'borderline';
  previousValue?: number;
  referenceRange?: { min: number; max: number };
  lastUpdated?: string;
  trend?: 'up' | 'down' | 'stable';
  confidenceLevel?: 'high' | 'medium' | 'low';
  icon?: ReactNode;
  className?: string;
}

export function MedicalMetricCard({
  title,
  value,
  unit,
  status = 'normal',
  previousValue,
  referenceRange,
  lastUpdated,
  trend,
  confidenceLevel = 'high',
  icon,
  className = '',
}: MedicalMetricCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'normal':
        return 'text-medical-success-600 bg-medical-success-50 border-medical-success-200';
      case 'abnormal':
        return 'text-medical-error-600 bg-medical-error-50 border-medical-error-200';
      case 'borderline':
        return 'text-medical-warning-600 bg-medical-warning-50 border-medical-warning-200';
      default:
        return 'text-medical-neutral-600 bg-medical-neutral-50 border-medical-neutral-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'normal':
        return '✓';
      case 'abnormal':
        return '!';
      case 'borderline':
        return '⚠';
      default:
        return '○';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      case 'stable':
        return '→';
      default:
        return null;
    }
  };

  const getConfidenceColor = () => {
    switch (confidenceLevel) {
      case 'high':
        return 'text-medical-success-600';
      case 'medium':
        return 'text-medical-warning-600';
      case 'low':
        return 'text-medical-error-600';
      default:
        return 'text-medical-neutral-500';
    }
  };

  const calculateChange = () => {
    if (typeof value === 'number' && previousValue) {
      const change = ((value - previousValue) / previousValue) * 100;
      return change.toFixed(1);
    }
    return null;
  };

  return (
    <div className={`medical-card group hover:shadow-md transition-all duration-300 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          {icon && (
            <div className="w-8 h-8 bg-medical-primary-100 rounded-lg flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h3 className="font-medium text-medical-neutral-900 text-sm">{title}</h3>
            {confidenceLevel !== 'high' && (
              <div className={`text-xs ${getConfidenceColor()} flex items-center space-x-1`}>
                <span>●</span>
                <span>{confidenceLevel} confidence</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`px-2 py-1 rounded-full border text-xs font-medium flex items-center space-x-1 ${getStatusColor()}`}>
          <span>{getStatusIcon()}</span>
          <span className="capitalize">{status}</span>
        </div>
      </div>

      {/* Main Value */}
      <div className="flex items-baseline space-x-2 mb-3">
        <span className="metric-value text-medical-neutral-900">
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        {unit && (
          <span className="metric-unit">{unit}</span>
        )}
        {trend && (
          <div className="flex items-center space-x-1 text-medical-neutral-500">
            <span className="text-sm">{getTrendIcon()}</span>
            {calculateChange() && (
              <span className="text-xs">
                {calculateChange()}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Reference Range */}
      {referenceRange && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-medical-neutral-500 mb-1">
            <span>Normal Range</span>
            <span>{referenceRange.min} - {referenceRange.max} {unit}</span>
          </div>
          <div className="w-full bg-medical-neutral-200 rounded-full h-2 relative overflow-hidden">
            {/* Normal range bar */}
            <div className="absolute inset-0 bg-medical-success-200 rounded-full"></div>
            
            {/* Current value indicator */}
            {typeof value === 'number' && (
              <div
                className="absolute top-0 w-1 h-full bg-medical-neutral-800 rounded-full transition-all duration-300"
                style={{
                  left: `${Math.max(0, Math.min(100, 
                    ((value - referenceRange.min) / (referenceRange.max - referenceRange.min)) * 100
                  ))}%`,
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-medical-neutral-500">
        {lastUpdated && (
          <span>Updated {lastUpdated}</span>
        )}
        {previousValue && (
          <span>
            Previous: {previousValue.toFixed(1)} {unit}
          </span>
        )}
      </div>
    </div>
  );
}
