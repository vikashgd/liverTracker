"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export type SeriesPoint = { date: string; value: number | null; reportCount?: number };

interface ReportDotsChartProps {
  title: string;
  color: string;
  data: SeriesPoint[];
  unit: string;
  range: { low: number; high: number };
  lastUpdated?: string;
}

export function ReportDotsChart({
  title,
  color,
  data,
  unit,
  range,
  lastUpdated,
}: ReportDotsChartProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  const [selectedPoint, setSelectedPoint] = useState<SeriesPoint | null>(null);
  
  if (!data || data.length === 0) {
    return (
      <div className="medical-card p-6 text-center">
        <h3 className="text-lg font-semibold text-medical-neutral-900 mb-2">{title}</h3>
        <p className="text-medical-neutral-500">No data available</p>
      </div>
    );
  }

  // Filter and sort data
  const validData = data
    .filter(d => d.value !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Determine status for each value
  const getStatusInfo = (value: number) => {
    if (value < range.low * 0.8) return { 
      color: 'bg-red-500', 
      icon: '🔴', 
      text: 'Very Low',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800'
    };
    if (value < range.low) return { 
      color: 'bg-orange-500', 
      icon: '🟠', 
      text: 'Low',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800'
    };
    if (value > range.high * 1.5) return { 
      color: 'bg-red-500', 
      icon: '🔴', 
      text: 'Very High',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800'
    };
    if (value > range.high) return { 
      color: 'bg-orange-500', 
      icon: '🟠', 
      text: 'High',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800'
    };
    return { 
      color: 'bg-green-500', 
      icon: '🟢', 
      text: 'Normal',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800'
    };
  };

  // Calculate positioning for dots
  const minValue = Math.min(range.low * 0.5, Math.min(...validData.map(d => d.value!)));
  const maxValue = Math.max(range.high * 1.5, Math.max(...validData.map(d => d.value!)));
  const valueRange = maxValue - minValue;

  return (
    <div className="medical-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-medical-neutral-900">{title}</h3>
          <p className="text-sm text-medical-neutral-500">
            {validData.length} reports • {unit}
          </p>
        </div>
      </div>

      {/* Reference Range Legend */}
      <div className="mb-4 p-3 bg-medical-neutral-50 rounded-lg">
        <div className="text-xs text-medical-neutral-600 mb-2">Reference Range</div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-red-600">Very Low (&lt;{(range.low * 0.8).toFixed(1)})</span>
          <span className="text-orange-600">Low ({(range.low * 0.8).toFixed(1)}-{range.low})</span>
          <span className="text-green-600 font-medium">Normal ({range.low}-{range.high})</span>
          <span className="text-orange-600">High ({range.high}-{(range.high * 1.5).toFixed(1)})</span>
          <span className="text-red-600">Very High (&gt;{(range.high * 1.5).toFixed(1)})</span>
        </div>
      </div>

      {/* Visual Chart Area */}
      <div className="relative bg-white border rounded-lg p-4 mb-4" style={{ minHeight: '200px' }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-medical-neutral-400 pr-2">
          <span>{maxValue.toFixed(1)}</span>
          <span>{range.high}</span>
          <span>{((range.high + range.low) / 2).toFixed(1)}</span>
          <span>{range.low}</span>
          <span>{minValue.toFixed(1)}</span>
        </div>

        {/* Reference bands */}
        <div className="absolute left-8 right-4 top-0 bottom-0">
          {/* Normal range band */}
          <div 
            className="absolute w-full bg-green-100 border-y border-green-200"
            style={{
              top: `${(1 - (range.high - minValue) / valueRange) * 100}%`,
              height: `${((range.high - range.low) / valueRange) * 100}%`
            }}
          />
          
          {/* Data points */}
          {validData.map((point, index) => {
            const status = getStatusInfo(point.value!);
            const yPosition = (1 - (point.value! - minValue) / valueRange) * 100;
            const xPosition = (index / (validData.length - 1 || 1)) * 100;
            
            return (
              <div
                key={index}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-125`}
                style={{
                  left: `${xPosition}%`,
                  top: `${yPosition}%`
                }}
                onClick={() => setSelectedPoint(selectedPoint === point ? null : point)}
              >
                <div className={`w-4 h-4 rounded-full ${status.color} border-2 border-white shadow-md relative`}>
                  {/* Show duplicate indicator */}
                  {(point.reportCount || 1) > 1 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                      {point.reportCount}
                    </div>
                  )}
                </div>
                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 text-xs text-medical-neutral-600 whitespace-nowrap">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {(point.reportCount || 1) > 1 && (
                    <div className="text-blue-600 font-medium">
                      {point.reportCount} reports
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis (dates) */}
        <div className="absolute bottom-0 left-8 right-4 flex justify-between text-xs text-medical-neutral-400">
          {validData.length > 1 && isClient && (
            <>
              <span>{new Date(validData[0].date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</span>
              <span>{new Date(validData[validData.length - 1].date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</span>
            </>
          )}
          {!isClient && validData.length > 1 && (
            <>
              <span>Start</span>
              <span>End</span>
            </>
          )}
        </div>
      </div>

      {/* Selected Point Details */}
      {selectedPoint && (
        <div className={`p-3 rounded-lg border mb-4 ${getStatusInfo(selectedPoint.value!).bgColor} ${getStatusInfo(selectedPoint.value!).borderColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg">{getStatusInfo(selectedPoint.value!).icon}</span>
              <div>
                <div className="font-semibold">
                  {selectedPoint.value} <span className="font-normal text-sm">{unit}</span>
                </div>
                <div className="text-sm opacity-75">
                  {isClient 
                    ? new Date(selectedPoint.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'Date loading...'
                  }
                </div>
              </div>
            </div>
            <div className={`text-sm font-medium ${getStatusInfo(selectedPoint.value!).textColor}`}>
              {getStatusInfo(selectedPoint.value!).text}
            </div>
          </div>
        </div>
      )}

      {/* All Reports List */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-medical-neutral-700 mb-2">All Reports</div>
        {validData.slice().reverse().map((point, index) => {
          const status = getStatusInfo(point.value!);
          const isSelected = selectedPoint === point;
          
          return (
            <div 
              key={index} 
              className={`p-2 rounded border cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-blue-500' : ''
              } ${status.bgColor} ${status.borderColor}`}
              onClick={() => setSelectedPoint(isSelected ? null : point)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span>{status.icon}</span>
                  <span className="font-medium">{point.value} {unit}</span>
                  <span className={`text-xs px-2 py-1 rounded ${status.textColor}`}>
                    {status.text}
                  </span>
                </div>
                <div className="text-xs text-medical-neutral-600">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-medical-neutral-200">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-semibold text-medical-neutral-900">
              {Math.max(...validData.map(d => d.value!))}
            </div>
            <div className="text-medical-neutral-500 text-xs">Highest</div>
          </div>
          <div>
            <div className="font-semibold text-medical-neutral-900">
              {Math.min(...validData.map(d => d.value!))}
            </div>
            <div className="text-medical-neutral-500 text-xs">Lowest</div>
          </div>
          <div>
            <div className="font-semibold text-medical-neutral-900">
              {(validData.reduce((sum, d) => sum + d.value!, 0) / validData.length).toFixed(1)}
            </div>
            <div className="text-medical-neutral-500 text-xs">Average</div>
          </div>
        </div>
      </div>

      {lastUpdated && (
        <div className="mt-3 text-xs text-medical-neutral-400 text-center">
          Last updated: {lastUpdated}
        </div>
      )}
    </div>
  );
}
