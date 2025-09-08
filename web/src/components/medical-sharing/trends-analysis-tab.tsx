"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3, Calendar, Activity } from "lucide-react";

interface TrendDataPoint {
  date: Date;
  value: number;
  isAbnormal?: boolean;
  confidence?: number;
}

interface ChartSeries {
  name: string;
  data: TrendDataPoint[];
  unit: string;
  referenceRange?: {
    min: number;
    max: number;
    unit: string;
  };
}

interface TrendsAnalysisTabProps {
  trends: ChartSeries[];
}

export function TrendsAnalysisTab({ trends }: TrendsAnalysisTabProps) {

  // Helper function to determine trend direction
  const getTrendDirection = (data: TrendDataPoint[]) => {
    if (!data || data.length < 2) return 'stable';
    
    const recent = data.slice(-3); // Last 3 points
    const first = recent[0]?.value;
    const last = recent[recent.length - 1]?.value;
    
    if (!first || !last) return 'stable';
    
    const change = ((last - first) / first) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  };

  // Helper function to get trend icon
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  // Helper function to format value
  const formatValue = (value: number, unit: string) => {
    return `${value.toFixed(1)} ${unit}`;
  };

  // Helper function to create professional trend chart
  const createTrendChart = (data: TrendDataPoint[], name: string, unit: string, referenceRange?: any) => {
    if (!data || data.length === 0) return null;
    
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    // Create SVG path for the trend line
    const chartWidth = 320;
    const chartHeight = 140;
    const padding = 25;
    
    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * (chartWidth - 2 * padding);
      const y = chartHeight - padding - ((point.value - min) / range) * (chartHeight - 2 * padding);
      return { x, y, value: point.value, date: point.date, isAbnormal: point.isAbnormal };
    });
    
    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');
    
    // Calculate trend direction for this specific metric
    const direction = getTrendDirection(data);
    const isImproving = direction === 'decreasing'; // For most lab values, decreasing is better
    const currentValue = data[data.length - 1]?.value || 0;
    const previousValue = data[data.length - 2]?.value || currentValue;
    const percentChange = previousValue !== 0 ? ((currentValue - previousValue) / previousValue * 100) : 0;
    
    return (
      <div className="bg-white rounded-xl border border-medical-neutral-200 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold text-medical-neutral-900 text-lg">{name}</h4>
            <p className="text-sm text-medical-neutral-600">{data.length} measurements tracked</p>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon(direction)}
            <span className={`text-sm font-medium ${
              direction === 'increasing' ? 'text-red-600' : 
              direction === 'decreasing' ? 'text-green-600' : 'text-gray-600'
            }`}>
              {direction === 'increasing' ? 'Rising' : 
               direction === 'decreasing' ? 'Falling' : 'Stable'}
            </span>
          </div>
        </div>
        
        {/* Current Value with Change */}
        <div className="mb-5">
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-medical-neutral-900">
              {formatValue(currentValue, unit)}
            </div>
            {data.length > 1 && (
              <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                percentChange > 0 ? 'bg-red-100 text-red-700' : 
                percentChange < 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
              </div>
            )}
          </div>
          <div className="text-sm text-medical-neutral-600 mt-1">
            Latest measurement from {new Date(data[data.length - 1]?.date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        </div>

        {/* Enhanced SVG Chart */}
        <div className="relative bg-medical-neutral-50 rounded-lg p-3">
          <svg width={chartWidth} height={chartHeight} className="w-full h-auto">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Reference range background */}
            {referenceRange && (
              <>
                <rect
                  x={padding}
                  y={chartHeight - padding - ((referenceRange.max - min) / range) * (chartHeight - 2 * padding)}
                  width={chartWidth - 2 * padding}
                  height={((referenceRange.max - referenceRange.min) / range) * (chartHeight - 2 * padding)}
                  fill="rgba(34, 197, 94, 0.15)"
                  stroke="rgba(34, 197, 94, 0.4)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  rx="2"
                />
                <text 
                  x={padding + 5} 
                  y={chartHeight - padding - ((referenceRange.max - min) / range) * (chartHeight - 2 * padding) - 5}
                  className="text-xs fill-green-600 font-medium"
                >
                  Normal Range
                </text>
              </>
            )}
            
            {/* Trend area fill */}
            <path
              d={`${pathData} L ${points[points.length - 1]?.x} ${chartHeight - padding} L ${points[0]?.x} ${chartHeight - padding} Z`}
              fill="rgba(59, 130, 246, 0.1)"
            />
            
            {/* Trend line */}
            <path
              d={pathData}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 2px 4px rgba(59, 130, 246, 0.2))"
            />
            
            {/* Data points */}
            {points.map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill={point.isAbnormal ? "#ef4444" : "#3b82f6"}
                  stroke="white"
                  strokeWidth="3"
                  className="hover:r-8 transition-all cursor-pointer drop-shadow-sm"
                />
                {/* Hover tooltip */}
                <title>
                  {new Date(point.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}: {formatValue(point.value, unit)}
                  {point.isAbnormal ? ' (Abnormal)' : ''}
                </title>
              </g>
            ))}
            
            {/* Y-axis labels */}
            <text x="10" y={padding - 5} className="text-xs fill-gray-600 font-medium" textAnchor="start">
              {formatValue(max, '')}
            </text>
            <text x="10" y={chartHeight - padding + 15} className="text-xs fill-gray-600 font-medium" textAnchor="start">
              {formatValue(min, '')}
            </text>
            
            {/* X-axis labels */}
            <text x={padding} y={chartHeight - 5} className="text-xs fill-gray-600" textAnchor="start">
              {new Date(data[0]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
            <text x={chartWidth - padding} y={chartHeight - 5} className="text-xs fill-gray-600" textAnchor="end">
              {new Date(data[data.length - 1]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
          </svg>
        </div>

        {/* Reference Range and Status */}
        <div className="mt-4 flex items-center justify-between">
          {referenceRange && (
            <div className="text-sm text-medical-neutral-600">
              <span className="font-medium">Normal Range:</span> {referenceRange.min}-{referenceRange.max} {referenceRange.unit}
            </div>
          )}
          <div className={`text-sm font-medium px-3 py-1 rounded-full ${
            currentValue >= (referenceRange?.min || 0) && currentValue <= (referenceRange?.max || Infinity)
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {currentValue >= (referenceRange?.min || 0) && currentValue <= (referenceRange?.max || Infinity)
              ? '✓ Normal'
              : '⚠ Abnormal'
            }
          </div>
        </div>
      </div>
    );
  };

  if (!trends || trends.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-medical-neutral-900 mb-2">
            Trends Analysis
          </h3>
          <p className="text-medical-neutral-600 max-w-2xl mx-auto">
            Track the progression of key medical metrics over time to identify patterns and monitor health improvements
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-12 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-blue-600" />
          </div>
          <h4 className="text-xl font-semibold text-blue-900 mb-3">
            Insufficient Data for Trends
          </h4>
          <p className="text-blue-700 mb-6 max-w-md mx-auto">
            Trend analysis requires multiple laboratory reports over time to identify meaningful patterns and changes in your health metrics.
          </p>
          
          <div className="bg-white rounded-lg p-4 border border-blue-200 max-w-md mx-auto">
            <h5 className="font-medium text-blue-900 mb-2">What you'll see with more data:</h5>
            <div className="text-sm text-blue-700 space-y-1">
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Visual trend charts for each metric</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Activity className="w-4 h-4" />
                <span>Progress tracking over time</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Historical pattern analysis</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-semibold text-medical-neutral-900 mb-2">
          Trends Analysis
        </h3>
        <p className="text-medical-neutral-600 max-w-2xl mx-auto">
          Historical progression of {trends.length} key medical metrics with pattern analysis and trend identification
        </p>
      </div>

      {/* Key Metrics Overview */}
      <div className="bg-gradient-to-r from-medical-primary-50 to-blue-50 rounded-xl p-6 border border-medical-primary-200">
        <h4 className="text-lg font-semibold text-medical-primary-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Trend Overview
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {trends.filter(s => getTrendDirection(s.data) === 'decreasing').length}
            </div>
            <div className="text-sm text-green-700">Improving</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {trends.filter(s => getTrendDirection(s.data) === 'increasing').length}
            </div>
            <div className="text-sm text-red-700">Worsening</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {trends.filter(s => getTrendDirection(s.data) === 'stable').length}
            </div>
            <div className="text-sm text-gray-700">Stable</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-medical-primary-600">
              {trends.reduce((sum, s) => sum + s.data.length, 0)}
            </div>
            <div className="text-sm text-medical-primary-700">Total Points</div>
          </div>
        </div>
      </div>

      {/* Trends Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {trends.map((series, index) => 
          createTrendChart(series.data, series.name, series.unit, series.referenceRange)
        )}
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-medical-neutral-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-medical-neutral-900">Trend Analysis</h4>
          </div>
          <div className="space-y-3">
            {trends.map((series, index) => {
              const direction = getTrendDirection(series.data);
              const directionText = direction === 'increasing' ? 'Rising' : 
                                  direction === 'decreasing' ? 'Falling' : 'Stable';
              const colorClass = direction === 'increasing' ? 'text-red-600' : 
                               direction === 'decreasing' ? 'text-green-600' : 'text-gray-600';
              const bgClass = direction === 'increasing' ? 'bg-red-50' : 
                             direction === 'decreasing' ? 'bg-green-50' : 'bg-gray-50';
              
              return (
                <div key={index} className={`flex justify-between items-center p-3 rounded-lg ${bgClass}`}>
                  <div>
                    <span className="font-medium text-medical-neutral-900">{series.name}</span>
                    <div className="text-sm text-medical-neutral-600">{series.data.length} measurements</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(direction)}
                    <span className={`font-medium ${colorClass}`}>{directionText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-medical-neutral-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-green-600" />
            <h4 className="text-lg font-semibold text-medical-neutral-900">Data Timeline</h4>
          </div>
          <div className="space-y-4">
            {trends.length > 0 && (
              <>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-900">Monitoring Period</span>
                    <span className="text-green-700">
                      {Math.ceil((
                        new Date(Math.max(...trends.flatMap(s => s.data.map(d => new Date(d.date).getTime())))).getTime() -
                        new Date(Math.min(...trends.flatMap(s => s.data.map(d => new Date(d.date).getTime())))).getTime()
                      ) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-medical-neutral-700">First Report:</span>
                    <span className="font-medium text-medical-neutral-900">
                      {new Date(Math.min(...trends.flatMap(s => s.data.map(d => new Date(d.date).getTime())))).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-medical-neutral-700">Latest Report:</span>
                    <span className="font-medium text-medical-neutral-900">
                      {new Date(Math.max(...trends.flatMap(s => s.data.map(d => new Date(d.date).getTime())))).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-medical-neutral-700">Average Frequency:</span>
                    <span className="font-medium text-medical-neutral-900">
                      Every {Math.ceil((
                        new Date(Math.max(...trends.flatMap(s => s.data.map(d => new Date(d.date).getTime())))).getTime() -
                        new Date(Math.min(...trends.flatMap(s => s.data.map(d => new Date(d.date).getTime())))).getTime()
                      ) / (1000 * 60 * 60 * 24) / Math.max(1, trends.reduce((sum, s) => sum + s.data.length, 0) - 1))} days
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}