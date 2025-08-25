"use client";

import { useState } from 'react';
import { formatMedicalValue } from '@/lib/medical-display-formatter';

interface ConversionNotificationProps {
  metricName: string;
  originalValue: number;
  originalUnit?: string;
  onDismiss?: () => void;
  className?: string;
}

export function ConversionNotification({ 
  metricName, 
  originalValue, 
  originalUnit,
  onDismiss,
  className = ''
}: ConversionNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  const formatted = formatMedicalValue(metricName, originalValue, originalUnit);
  
  // Only show if conversion was applied
  if (!formatted.wasConverted || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div className={`
      bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 
      transition-all duration-300 ease-in-out
      ${className}
    `}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-lg">🔧</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-blue-900">
              Unit Conversion Applied
            </h4>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {metricName}
            </span>
          </div>
          
          <p className="text-sm text-blue-700 mb-2">
            {formatted.conversionNote}
          </p>
          
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Original:</span>
              <span className="font-medium text-gray-700">
                {originalValue} {originalUnit || ''}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Converted:</span>
              <span className="font-medium text-blue-700">
                {formatted.displayValue} {formatted.displayUnit}
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-blue-400 hover:text-blue-600 transition-colors"
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface BatchConversionNotificationProps {
  conversions: Array<{
    metricName: string;
    originalValue: number;
    originalUnit?: string;
  }>;
  onDismiss?: () => void;
  className?: string;
}

export function BatchConversionNotification({ 
  conversions, 
  onDismiss,
  className = ''
}: BatchConversionNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Filter to only conversions that were actually applied
  const actualConversions = conversions.filter(conv => {
    const formatted = formatMedicalValue(conv.metricName, conv.originalValue, conv.originalUnit);
    return formatted.wasConverted;
  });
  
  if (actualConversions.length === 0 || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div className={`
      bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4 
      transition-all duration-300 ease-in-out shadow-sm
      ${className}
    `}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-lg">🔧</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-semibold text-blue-900">
              Unit Conversions Applied
            </h4>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {actualConversions.length} parameter{actualConversions.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <p className="text-sm text-blue-700 mb-3">
            Values have been converted to standard medical units for consistency and accuracy.
          </p>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mb-2"
          >
            {isExpanded ? 'Hide' : 'Show'} conversion details
            <svg 
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isExpanded && (
            <div className="space-y-2 bg-white bg-opacity-50 rounded-lg p-3 border border-blue-100">
              {actualConversions.map((conv, index) => {
                const formatted = formatMedicalValue(conv.metricName, conv.originalValue, conv.originalUnit);
                return (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">{conv.metricName}:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">
                        {conv.originalValue} {conv.originalUnit || ''}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-blue-700">
                        {formatted.displayValue} {formatted.displayUnit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-blue-400 hover:text-blue-600 transition-colors"
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Utility function to check if any conversions would be applied
export function hasConversions(metrics: Array<{ name: string; value: number; unit?: string }>): boolean {
  return metrics.some(metric => {
    const formatted = formatMedicalValue(metric.name, metric.value, metric.unit);
    return formatted.wasConverted;
  });
}

// Utility function to get conversion summary
export function getConversionSummary(metrics: Array<{ name: string; value: number; unit?: string }>): {
  totalMetrics: number;
  convertedMetrics: number;
  conversions: Array<{
    metricName: string;
    originalValue: number;
    originalUnit?: string;
    displayValue: number;
    displayUnit: string;
    conversionNote?: string;
  }>;
} {
  const conversions = metrics
    .map(metric => {
      const formatted = formatMedicalValue(metric.name, metric.value, metric.unit);
      return {
        metricName: metric.name,
        originalValue: metric.value,
        originalUnit: metric.unit,
        displayValue: formatted.displayValue,
        displayUnit: formatted.displayUnit,
        conversionNote: formatted.conversionNote,
        wasConverted: formatted.wasConverted
      };
    })
    .filter(conv => conv.wasConverted);

  return {
    totalMetrics: metrics.length,
    convertedMetrics: conversions.length,
    conversions
  };
}