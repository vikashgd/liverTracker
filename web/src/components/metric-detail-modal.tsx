"use client";

import { useState, useEffect } from "react";
import { SeriesPoint } from "@/components/trend-chart";
import { CanonicalMetric } from "@/lib/metrics";

type ChartSpec = { 
  title: CanonicalMetric; 
  color: string; 
  data: SeriesPoint[]; 
  range: { low: number; high: number }; 
  unit: string;
};

interface MetricDetailModalProps {
  chart: ChartSpec | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MetricDetailModal({ chart, isOpen, onClose }: MetricDetailModalProps) {
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y' | 'all'>('all');
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen && isClient) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      if (isClient) {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen, onClose, isClient]);

  if (!isOpen || !chart || !isClient) return null;

  const validData = chart.data.filter(d => d.value !== null && d.value !== undefined);
  const latestData = validData[validData.length - 1];

  // Filter data based on time range
  const getFilteredData = () => {
    if (timeRange === 'all') return validData;
    
    const cutoffDate = new Date();
    const daysMap = { '3m': 90, '6m': 180, '1y': 365 };
    cutoffDate.setDate(cutoffDate.getDate() - daysMap[timeRange]);
    
    return validData.filter(d => new Date(d.date) >= cutoffDate);
  };

  const filteredData = getFilteredData();

  // Calculate statistics
  const values = filteredData.map(d => d.value);
  const stats = {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((sum, val) => sum + val, 0) / values.length,
    count: filteredData.length,
    trend: calculateTrend(filteredData),
    outOfRange: filteredData.filter(d => d.value < chart.range.low || d.value > chart.range.high).length
  };

  function calculateTrend(data: SeriesPoint[]) {
    if (data.length < 2) return 'insufficient_data';
    
    const recent = data.slice(-3).map(d => d.value);
    const older = data.slice(-6, -3).map(d => d.value);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'increasing': return { icon: '📈', color: 'text-green-600', text: 'Increasing' };
      case 'decreasing': return { icon: '📉', color: 'text-red-600', text: 'Decreasing' };
      case 'stable': return { icon: '📊', color: 'text-blue-600', text: 'Stable' };
      default: return { icon: '❓', color: 'text-gray-600', text: 'Unknown' };
    }
  };

  const trend = getTrendIcon();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-4">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: chart.color }}
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{chart.title}</h2>
                <p className="text-gray-600">Detailed Analysis & Trends</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Latest Value</div>
                <div className="text-2xl font-bold text-blue-900">
                  {latestData?.value.toFixed(2)} {chart.unit}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {latestData && isClient && new Date(latestData.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                  {!isClient && "--/--/----"}
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">Average</div>
                <div className="text-2xl font-bold text-green-900">
                  {stats.avg.toFixed(2)} {chart.unit}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Last {stats.count} readings
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium">Range</div>
                <div className="text-lg font-bold text-purple-900">
                  {stats.min.toFixed(1)} - {stats.max.toFixed(1)}
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  Min - Max values
                </div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm text-orange-600 font-medium">Trend</div>
                <div className={`text-lg font-bold ${trend.color} flex items-center gap-2`}>
                  <span>{trend.icon}</span>
                  <span>{trend.text}</span>
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  {stats.outOfRange} abnormal values
                </div>
              </div>
            </div>

            {/* Time Range Filter */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Historical Trend</h3>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                {['3m', '6m', '1y', 'all'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimeRange(period as any)}
                    className={`
                      px-3 py-2 rounded-md text-sm font-medium transition-all
                      ${timeRange === period 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    {period === 'all' ? 'All Time' : period.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Large Interactive Chart */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <LargeInteractiveChart 
                data={filteredData} 
                color={chart.color} 
                range={chart.range} 
                unit={chart.unit}
                isClient={isClient}
              />
            </div>

            {/* Normal Range Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-yellow-800 mb-2">📋 Reference Range</h4>
              <div className="text-yellow-700">
                Normal range: <strong>{chart.range.low} - {chart.range.high} {chart.unit}</strong>
              </div>
              <div className="text-sm text-yellow-600 mt-1">
                Values outside this range may indicate health concerns and should be discussed with your healthcare provider.
              </div>
            </div>

            {/* Data Table - Mobile Optimized */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h4 className="font-semibold text-gray-900">Recent Readings</h4>
              </div>
              
              {/* Mobile Card Layout */}
              <div className="md:hidden p-4 space-y-3 max-h-64 overflow-y-auto">
                {filteredData.slice().reverse().slice(0, 5).map((point, index) => {
                  const isHigh = point.value > chart.range.high;
                  const isLow = point.value < chart.range.low;
                  const isNormal = !isHigh && !isLow;
                  
                  const prevPoint = filteredData[filteredData.length - index - 2];
                  const change = prevPoint ? ((point.value - prevPoint.value) / prevPoint.value * 100) : null;
                  
                  return (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {point.value.toFixed(1)} {chart.unit}
                          </div>
                          <div className="text-sm text-gray-500">
                            {isClient 
                              ? new Date(point.date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: '2-digit' 
                                })
                              : '--/--/--'
                            }
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isNormal ? 'bg-green-100 text-green-800' :
                            isHigh ? 'bg-red-100 text-red-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {isNormal ? '✓ Normal' : isHigh ? '↑ High' : '↓ Low'}
                          </span>
                          {change !== null && (
                            <div className={`text-xs mt-1 ${
                              Math.abs(change) < 5 ? 'text-gray-600' :
                              change > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {Math.abs(change) < 5 ? '→' : change > 0 ? '↗' : '↘'}
                              {Math.abs(change).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredData.length > 5 && (
                  <div className="text-center text-xs text-gray-500 mt-2 py-2">
                    Showing latest 5 • {filteredData.length} total readings
                  </div>
                )}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.slice().reverse().map((point, index) => {
                      const isHigh = point.value > chart.range.high;
                      const isLow = point.value < chart.range.low;
                      const isNormal = !isHigh && !isLow;
                      
                      const prevPoint = filteredData[filteredData.length - index - 2];
                      const change = prevPoint ? ((point.value - prevPoint.value) / prevPoint.value * 100) : null;
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {isClient 
                              ? new Date(point.date).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })
                              : '--/--/----'
                            }
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {point.value.toFixed(2)} {chart.unit}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isNormal ? 'bg-green-100 text-green-800' :
                              isHigh ? 'bg-red-100 text-red-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {isNormal ? 'Normal' : isHigh ? 'High' : 'Low'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {change !== null ? (
                              <span className={`flex items-center ${
                                Math.abs(change) < 5 ? 'text-gray-600' :
                                change > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {Math.abs(change) < 5 ? '→' : change > 0 ? '↗' : '↘'}
                                <span className="ml-1">{Math.abs(change).toFixed(1)}%</span>
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LargeInteractiveChart({ data, color, range, unit, isClient }: { 
  data: SeriesPoint[], 
  color: string, 
  range: { low: number; high: number }, 
  unit: string,
  isClient: boolean
}) {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        No data available for the selected time period
      </div>
    );
  }

  // Mobile-responsive dimensions
  const width = isMobile ? 340 : 800;
  const height = isMobile ? 280 : 400;
  const padding = isMobile 
    ? { top: 20, right: 15, bottom: 50, left: 45 }
    : { top: 40, right: 80, bottom: 80, left: 80 };

  const values = data.map(d => d.value);
  const minValue = Math.min(...values, range.low) * 0.9;
  const maxValue = Math.max(...values, range.high) * 1.1;
  const valueRange = maxValue - minValue;

  const getY = (value: number) => {
    if (valueRange === 0) return height / 2;
    return padding.top + ((maxValue - value) / valueRange) * (height - padding.top - padding.bottom);
  };

  const getX = (index: number) => {
    if (data.length === 1) return width / 2;
    return padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
  };

  const pathData = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`).join(' ');

  const handlePointClick = (index: number) => {
    setSelectedPoint(selectedPoint === index ? null : index);
  };

  return (
    <div className="relative">
      {/* Mobile Chart */}
      {isMobile ? (
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="mx-auto">
            {/* Simplified grid for mobile */}
            <defs>
              <pattern id="mobileGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#f8fafc" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mobileGrid)" />
            
            {/* Y-axis - only 3 labels for mobile */}
            {[minValue, (minValue + maxValue) / 2, maxValue].map((value, i) => (
              <g key={i}>
                <line
                  x1={padding.left - 5}
                  y1={getY(value)}
                  x2={padding.left}
                  y2={getY(value)}
                  stroke="#9ca3af"
                  strokeWidth={1}
                />
                <text
                  x={padding.left - 8}
                  y={getY(value) + 3}
                  textAnchor="end"
                  className="fill-gray-600 text-xs"
                >
                  {value.toFixed(0)}
                </text>
              </g>
            ))}

            {/* Normal range background */}
            <rect
              x={padding.left}
              y={getY(range.high)}
              width={width - padding.left - padding.right}
              height={getY(range.low) - getY(range.high)}
              fill={color}
              fillOpacity={0.15}
              rx={2}
            />

            {/* Chart line - thicker for mobile */}
            <path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points - larger touch targets */}
            {data.map((d, i) => {
              const isOutOfRange = d.value < range.low || d.value > range.high;
              const isSelected = selectedPoint === i;
              
              return (
                <g key={i}>
                  {/* Large invisible touch area */}
                  <circle
                    cx={getX(i)}
                    cy={getY(d.value)}
                    r={25}
                    fill="transparent"
                    className="cursor-pointer"
                    onClick={() => handlePointClick(i)}
                  />
                  
                  {/* Visible point */}
                  <circle
                    cx={getX(i)}
                    cy={getY(d.value)}
                    r={isSelected ? 10 : 7}
                    fill={isOutOfRange ? "#ef4444" : color}
                    stroke="white"
                    strokeWidth={3}
                    className="transition-all duration-200"
                  />
                  
                  {/* Always visible info for selected point */}
                  {isSelected && (
                    <g>
                      <rect
                        x={getX(i) - 50}
                        y={getY(d.value) - 50}
                        width={100}
                        height={35}
                        fill="black"
                        fillOpacity={0.9}
                        rx={6}
                      />
                      <text
                        x={getX(i)}
                        y={getY(d.value) - 32}
                        textAnchor="middle"
                        className="fill-white text-sm font-semibold"
                      >
                        {d.value.toFixed(1)} {unit}
                      </text>
                      <text
                        x={getX(i)}
                        y={getY(d.value) - 18}
                        textAnchor="middle"
                        className="fill-white text-xs"
                      >
                        {isClient && new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </text>
                    </g>
                  )}

                  {/* Simplified date labels - show every other or every third */}
                  {i % Math.max(1, Math.ceil(data.length / 4)) === 0 && (
                    <text
                      x={getX(i)}
                      y={height - 15}
                      textAnchor="middle"
                      className="fill-gray-600 text-xs"
                      transform={`rotate(-20 ${getX(i)} ${height - 15})`}
                    >
                      {isClient 
                        ? new Date(d.date).toLocaleDateString('en-US', { month: 'short' })
                        : 'Date'
                      }
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          
          {/* Mobile instructions */}
          <div className="text-center mt-2 mb-2">
            <p className="text-xs text-gray-500">
              Tap any data point for details
            </p>
          </div>

          {/* Mobile legend - vertical layout */}
          <div className="flex flex-col space-y-2 px-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="text-sm">Normal values</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm">Out of range</span>
            </div>
          </div>
        </div>
      ) : (
        /* Desktop Chart - original design */
        <div className="relative">
          <svg width={width} height={height} className="mx-auto border border-gray-200 rounded-lg bg-white">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {[minValue, (minValue + maxValue) / 2, maxValue].map((value, i) => (
              <g key={i}>
                <line
                  x1={padding.left - 10}
                  y1={getY(value)}
                  x2={padding.left}
                  y2={getY(value)}
                  stroke="#6b7280"
                  strokeWidth={1}
                />
                <text
                  x={padding.left - 15}
                  y={getY(value) + 4}
                  textAnchor="end"
                  className="fill-gray-600 text-sm"
                >
                  {value.toFixed(1)}
                </text>
              </g>
            ))}

            <rect
              x={padding.left}
              y={getY(range.high)}
              width={width - padding.left - padding.right}
              height={getY(range.low) - getY(range.high)}
              fill={color}
              fillOpacity={0.1}
              rx={4}
            />

            <text
              x={width - padding.right + 10}
              y={getY(range.high) - 5}
              className="fill-gray-600 text-xs"
            >
              High: {range.high}
            </text>
            <text
              x={width - padding.right + 10}
              y={getY(range.low) + 15}
              className="fill-gray-600 text-xs"
            >
              Low: {range.low}
            </text>

            <path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {data.map((d, i) => {
              const isOutOfRange = d.value < range.low || d.value > range.high;
              const isSelected = selectedPoint === i;
              
              return (
                <g key={i}>
                  <circle
                    cx={getX(i)}
                    cy={getY(d.value)}
                    r={isSelected ? 8 : 6}
                    fill={isOutOfRange ? "#ef4444" : color}
                    stroke="white"
                    strokeWidth={2}
                    className="cursor-pointer transition-all duration-200 hover:r-8"
                    onClick={() => handlePointClick(i)}
                  />
                  
                  {isSelected && (
                    <g>
                      <rect
                        x={getX(i) - 60}
                        y={getY(d.value) - 40}
                        width={120}
                        height={30}
                        fill="black"
                        fillOpacity={0.8}
                        rx={4}
                      />
                      <text
                        x={getX(i)}
                        y={getY(d.value) - 20}
                        textAnchor="middle"
                        className="fill-white text-xs"
                      >
                        {d.value.toFixed(2)} {unit}
                      </text>
                    </g>
                  )}
                  
                  <text
                    x={getX(i)}
                    y={height - padding.bottom + 20}
                    textAnchor="middle"
                    className="fill-gray-600 text-xs"
                    transform={`rotate(-45 ${getX(i)} ${height - padding.bottom + 20})`}
                  >
                    {isClient 
                      ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : 'Date'
                    }
                  </text>
                </g>
              );
            })}
          </svg>
          
          <div className="flex justify-center mt-4 space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
              <span>Normal values</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span>Out of range</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-2 rounded" style={{ backgroundColor: color, opacity: 0.2 }}></div>
              <span>Normal range</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
