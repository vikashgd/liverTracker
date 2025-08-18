"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type SeriesPoint = { date: string; value: number | null };

interface MobileTrendChartProps {
  title: string;
  color: string;
  data: SeriesPoint[];
  unit: string;
  range: { low: number; high: number };
  lastUpdated?: string;
  enableExport?: boolean;
}

export function MobileTrendChart({
  title,
  color,
  data,
  unit,
  range,
  lastUpdated,
  enableExport = false,
}: MobileTrendChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('list');
  
  if (!data || data.length === 0) {
    return (
      <div className="medical-card p-6 text-center">
        <h3 className="text-lg font-semibold text-medical-neutral-900 mb-2">{title}</h3>
        <p className="text-medical-neutral-500">No data available</p>
      </div>
    );
  }

  // Sort data by date (newest first for mobile)
  const sortedData = [...data]
    .filter(d => d.value !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Determine status color for each value
  const getStatusColor = (value: number) => {
    if (value < range.low * 0.8) return 'text-red-600 bg-red-50 border-red-200'; // Very low
    if (value < range.low) return 'text-orange-600 bg-orange-50 border-orange-200'; // Low
    if (value > range.high * 1.5) return 'text-red-600 bg-red-50 border-red-200'; // Very high
    if (value > range.high) return 'text-orange-600 bg-orange-50 border-orange-200'; // High
    return 'text-green-600 bg-green-50 border-green-200'; // Normal
  };

  const getStatusIcon = (value: number) => {
    if (value < range.low * 0.8) return '🔴'; // Very low
    if (value < range.low) return '🟠'; // Low
    if (value > range.high * 1.5) return '🔴'; // Very high
    if (value > range.high) return '🟠'; // High
    return '🟢'; // Normal
  };

  const getStatusText = (value: number) => {
    if (value < range.low * 0.8) return 'Very Low';
    if (value < range.low) return 'Low';
    if (value > range.high * 1.5) return 'Very High';
    if (value > range.high) return 'High';
    return 'Normal';
  };

  // Mini chart view for mobile
  const renderMiniChart = () => {
    if (sortedData.length === 0) return null;

    const maxValue = Math.max(...sortedData.map(d => d.value!));
    const minValue = Math.min(...sortedData.map(d => d.value!));
    const valueRange = maxValue - minValue || 1;

    return (
      <div className="bg-medical-neutral-50 p-4 rounded-lg mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-medical-neutral-700">Trend</span>
          <span className="text-xs text-medical-neutral-500">{sortedData.length} points</span>
        </div>
        
        <div className="relative h-20 flex items-end justify-between">
          {/* Reference lines */}
          <div className="absolute inset-0 flex flex-col justify-between text-xs text-medical-neutral-400">
            <div className="border-t border-dashed border-medical-neutral-300"></div>
            <div className="border-t border-dashed border-medical-neutral-300"></div>
            <div className="border-t border-dashed border-medical-neutral-300"></div>
          </div>
          
          {/* Data points */}
          {sortedData.slice(0, 12).reverse().map((point, index) => {
            const height = ((point.value! - minValue) / valueRange) * 60 + 10;
            const statusColor = getStatusColor(point.value!);
            
            return (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full border-2 ${statusColor.includes('red') ? 'bg-red-500 border-red-600' :
                    statusColor.includes('orange') ? 'bg-orange-500 border-orange-600' :
                    'bg-green-500 border-green-600'
                    }`}
                  style={{ marginBottom: `${height}px` }}
                  title={`${point.value} ${unit} on ${point.date}`}
                />
                <div className="text-xs text-medical-neutral-400 mt-1 -rotate-45 transform-origin-center">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="medical-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-medical-neutral-900">{title}</h3>
          <p className="text-sm text-medical-neutral-500">
            {sortedData.length} data points • {unit}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setViewMode(viewMode === 'list' ? 'chart' : 'list')}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {viewMode === 'list' ? '📊' : '📋'}
          </Button>
          {enableExport && (
            <Button variant="outline" size="sm" className="text-xs">
              📤
            </Button>
          )}
        </div>
      </div>

      {/* Reference Range */}
      <div className="mb-4 p-3 bg-medical-neutral-50 rounded-lg">
        <div className="text-xs text-medical-neutral-600 mb-1">Normal Range</div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Normal: {range.low} - {range.high} {unit}</span>
          </div>
        </div>
      </div>

      {/* Mini Chart */}
      {viewMode === 'chart' && renderMiniChart()}

      {/* Data List */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {sortedData.map((point, index) => (
            <div key={index} className={`p-3 rounded-lg border ${getStatusColor(point.value!)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getStatusIcon(point.value!)}</span>
                  <div>
                    <div className="font-semibold">
                      {point.value} <span className="font-normal text-sm">{unit}</span>
                    </div>
                    <div className="text-sm opacity-75">
                      {new Date(point.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{getStatusText(point.value!)}</div>
                  <div className="text-xs opacity-75">
                    {index === 0 && 'Latest'}
                    {index > 0 && `${index + 1} ago`}
                  </div>
                </div>
              </div>
              
              {/* Trend indicator */}
              {index < sortedData.length - 1 && (
                <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                  <div className="flex items-center justify-between text-xs">
                    <span>vs Previous:</span>
                    <span className="flex items-center">
                      {point.value! > sortedData[index + 1].value! ? (
                        <>📈 +{(point.value! - sortedData[index + 1].value!).toFixed(1)}</>
                      ) : point.value! < sortedData[index + 1].value! ? (
                        <>📉 {(point.value! - sortedData[index + 1].value!).toFixed(1)}</>
                      ) : (
                        <>➡️ No change</>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-medical-neutral-200">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-semibold text-medical-neutral-900">
              {Math.max(...sortedData.map(d => d.value!))}
            </div>
            <div className="text-medical-neutral-500 text-xs">Highest</div>
          </div>
          <div>
            <div className="font-semibold text-medical-neutral-900">
              {Math.min(...sortedData.map(d => d.value!))}
            </div>
            <div className="text-medical-neutral-500 text-xs">Lowest</div>
          </div>
          <div>
            <div className="font-semibold text-medical-neutral-900">
              {(sortedData.reduce((sum, d) => sum + d.value!, 0) / sortedData.length).toFixed(1)}
            </div>
            <div className="text-medical-neutral-500 text-xs">Average</div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="mt-3 text-xs text-medical-neutral-400 text-center">
          Last updated: {lastUpdated}
        </div>
      )}
    </div>
  );
}
