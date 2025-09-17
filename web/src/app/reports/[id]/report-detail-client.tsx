'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { DeleteReportButton } from "@/components/delete-report-button";
import { formatMedicalValue, formatValueWithUnit } from "@/lib/medical-display-formatter";
import { FileImageDisplay, FilePdfDisplay, FileDownloadDisplay } from "@/components/file-display-components";
import { MultiFileDisplay } from "@/components/multi-file-display";
import { discoverBatchFiles, isBatchUpload } from "@/lib/batch-file-discovery";

// Batch file display component
function BatchFileDisplay({ reportId, primaryObjectKey, contentType }: {
  reportId: string;
  primaryObjectKey: string;
  contentType: string;
}) {
  const [batchFiles, setBatchFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBatchFiles = async () => {
      try {
        setIsLoading(true);
        const files = await discoverBatchFiles(primaryObjectKey);
        setBatchFiles(files);
        console.log(`📦 Discovered ${files.length} batch files:`, files);
      } catch (err) {
        console.error('❌ Failed to discover batch files:', err);
        setError('Failed to load batch files');
        // Fallback to single file display
        const fileName = primaryObjectKey.split('/').pop() || 'Unknown file';
        setBatchFiles([{
          objectKey: primaryObjectKey,
          fileName: fileName,
          contentType: contentType
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBatchFiles();
  }, [primaryObjectKey, contentType]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <div>
              <h4 className="font-medium text-blue-800">Loading Batch Files...</h4>
              <p className="text-sm text-blue-700">Discovering all uploaded images...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && batchFiles.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center space-x-2">
            <span className="text-red-600 text-lg">⚠️</span>
            <div>
              <h4 className="font-medium text-red-800">Error Loading Files</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MultiFileDisplay
      reportId={reportId}
      files={batchFiles}
    />
  );
}

// Enhanced trending chart component for the right panel
function LabTrendingChart({ currentMetrics, userId, selectedMetric }: {
  currentMetrics: any[];
  userId: string;
  selectedMetric: any | null;
}) {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (selectedMetric) {
      loadChartData(selectedMetric);
    }
  }, [selectedMetric]);

  const loadChartData = async (metric: any) => {
    setLoading(true);
    try {
      console.log(`📊 Loading real historical data for ${metric.name}...`);

      // Fetch real historical data from Medical Platform
      const response = await fetch(`/api/chart-data?metric=${encodeURIComponent(metric.name)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.statusText}`);
      }

      const chartSeries = await response.json();

      console.log(`✅ Loaded ${chartSeries.data.length} data points for ${metric.name}:`, chartSeries);

      // Handle different response scenarios
      const chartData: any = {
        title: metric.name,
        color: getMetricColor(metric.name),
        data: chartSeries.data.map((point: any) => ({
          date: point.date,
          value: point.value,
          reportCount: point.reportCount || 1
        })),
        range: getMetricRange(metric.name),
        unit: metric.unit || chartSeries.unit || '',
        metadata: chartSeries.metadata,
        warningType: null,
        warningMessage: null,
        errorType: null,
        errorMessage: null,
        error: null
      };

      // Check for different error/warning scenarios
      if (chartSeries.metadata?.isUnknownMetric) {
        chartData.warningType = 'unknown_metric';
        chartData.warningMessage = chartSeries.metadata.message;
      } else if (chartSeries.metadata?.hasError) {
        chartData.errorType = chartSeries.metadata.errorType;
        chartData.errorMessage = chartSeries.metadata.errorMessage;
      } else if (chartSeries.data.length === 0) {
        chartData.warningType = 'no_historical_data';
        chartData.warningMessage = `No historical data found for ${metric.name}. This appears to be the first recorded value.`;
      }

      setChartData(chartData);
    } catch (error) {
      console.error(`❌ Failed to load chart data for ${metric.name}:`, error);

      // Show error state with helpful message
      setChartData({
        title: metric.name,
        color: getMetricColor(metric.name),
        data: [],
        range: getMetricRange(metric.name),
        unit: metric.unit || '',
        error: error instanceof Error ? error.message : 'Failed to load data',
        warningType: null,
        warningMessage: null,
        errorType: null,
        errorMessage: null,
        metadata: null
      });
    } finally {
      setLoading(false);
    }
  };

  const getMetricColor = (metricName: string) => {
    const colorMap: { [key: string]: string } = {
      'ALT': '#8b5cf6',
      'AST': '#06b6d4',
      'Bilirubin': '#f59e0b',
      'Albumin': '#10b981',
      'Creatinine': '#ef4444',
      'INR': '#ec4899',
      'Platelets': '#f97316',
      'ALP': '#84cc16',
      'GGT': '#6366f1',
      'TotalProtein': '#14b8a6'
    };
    return colorMap[metricName] || '#6b7280';
  };

  const getMetricRange = (metricName: string) => {
    const rangeMap: { [key: string]: { low: number; high: number } } = {
      'ALT': { low: 7, high: 56 },
      'AST': { low: 10, high: 40 },
      'Bilirubin': { low: 0.1, high: 1.2 },
      'Albumin': { low: 3.5, high: 5.0 },
      'Creatinine': { low: 0.6, high: 1.2 },
      'INR': { low: 0.8, high: 1.1 },
      'Platelets': { low: 150, high: 450 },
      'ALP': { low: 44, high: 147 },
      'GGT': { low: 9, high: 48 },
      'TotalProtein': { low: 6.0, high: 8.3 }
    };
    return rangeMap[metricName] || { low: 0, high: 100 };
  };

  if (currentMetrics.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📊</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lab Data</h3>
        <p className="text-gray-600">No lab parameters available for trending analysis</p>
      </div>
    );
  }

  if (!selectedMetric) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📈</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Parameter</h3>
        <p className="text-gray-600">Click any lab parameter on the left to view its trending chart</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Metric Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{selectedMetric.name}</h3>
            <p className="text-sm text-gray-600">Historical trending analysis</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {(() => {
                if (selectedMetric.value) {
                  const formatted = formatMedicalValue(selectedMetric.name, selectedMetric.value, selectedMetric.unit);
                  return `${formatted.displayValue} ${formatted.displayUnit}`;
                }
                return `${selectedMetric.textValue || '—'} ${selectedMetric.unit || ''}`;
              })()}
            </div>
            <div className="text-xs text-gray-500">
              Current value
              {(() => {
                if (selectedMetric.value) {
                  const formatted = formatMedicalValue(selectedMetric.name, selectedMetric.value, selectedMetric.unit);
                  if (formatted.wasConverted) {
                    return (
                      <span className="ml-2 text-blue-600 font-medium">(converted)</span>
                    );
                  }
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Loading chart data...</p>
            </div>
          </div>
        ) : chartData ? (
          chartData.error ? (
            // Error state - data fetch failed
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Loading Error</h3>
                <p className="text-gray-600 max-w-sm mb-4">
                  Failed to load historical data for {chartData.title}
                </p>
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 mb-4">
                  {chartData.error}
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-700">
                    <strong>Current Value:</strong> {(() => {
                      if (selectedMetric?.value) {
                        const formatted = formatMedicalValue(selectedMetric.name, selectedMetric.value, selectedMetric.unit);
                        return `${formatted.displayValue} ${formatted.displayUnit}`;
                      }
                      return `${selectedMetric?.value} ${selectedMetric?.unit}`;
                    })()}
                  </p>
                  {(() => {
                    if (selectedMetric?.value) {
                      const formatted = formatMedicalValue(selectedMetric.name, selectedMetric.value, selectedMetric.unit);
                      if (formatted.wasConverted && formatted.conversionNote) {
                        return (
                          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                            <span>🔧</span>
                            <span>{formatted.conversionNote}</span>
                          </p>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          ) : chartData.warningType === 'unknown_metric' ? (
            // Unknown metric - show helpful message
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔍</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Unknown Parameter</h3>
                <p className="text-gray-600 max-w-sm mb-4">
                  {chartData.warningMessage}
                </p>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mb-4">
                  <p className="text-sm text-blue-700">
                    <strong>Current Value:</strong> {(() => {
                      if (selectedMetric?.value) {
                        const formatted = formatMedicalValue(selectedMetric.name, selectedMetric.value, selectedMetric.unit);
                        return `${formatted.displayValue} ${formatted.displayUnit}`;
                      }
                      return `${selectedMetric?.value} ${selectedMetric?.unit}`;
                    })()}
                  </p>
                  {(() => {
                    if (selectedMetric?.value) {
                      const formatted = formatMedicalValue(selectedMetric.name, selectedMetric.value, selectedMetric.unit);
                      if (formatted.wasConverted && formatted.conversionNote) {
                        return (
                          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                            <span>🔧</span>
                            <span>{formatted.conversionNote}</span>
                          </p>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  This parameter may be a custom lab test or a new metric not yet supported in our trending system.
                  The current value is still available above.
                </div>
              </div>
            </div>
          ) : chartData.data.length === 0 ? (
            // No historical data - first time recording
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📈</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Historical Data</h3>
                <p className="text-gray-600 max-w-sm mb-4">
                  {chartData.warningMessage || `No previous records found for ${chartData.title}. This appears to be the first recorded value for this parameter.`}
                </p>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mb-4">
                  <p className="text-sm text-blue-700">
                    <strong>Current Value:</strong> {(() => {
                      if (selectedMetric?.value) {
                        const formatted = formatMedicalValue(selectedMetric.name, selectedMetric.value, selectedMetric.unit);
                        return `${formatted.displayValue} ${formatted.displayUnit}`;
                      }
                      return `${selectedMetric?.value} ${selectedMetric?.unit}`;
                    })()}
                  </p>
                  {(() => {
                    if (selectedMetric?.value) {
                      const formatted = formatMedicalValue(selectedMetric.name, selectedMetric.value, selectedMetric.unit);
                      if (formatted.wasConverted && formatted.conversionNote) {
                        return (
                          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                            <span>🔧</span>
                            <span>{formatted.conversionNote}</span>
                          </p>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  Historical trending will be available once you have more lab reports with this parameter.
                </div>
              </div>
            </div>
          ) : (
            // Success state - show chart
            <DashboardStyleChart
              data={chartData.data}
              color={chartData.color}
              range={chartData.range}
              unit={chartData.unit}
              currentValue={parseFloat(selectedMetric?.value || '0')}
              isClient={isClient}
              title={chartData.title}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <span className="text-3xl mb-2 block">📈</span>
              <p>No chart data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Chart Stats */}
      {chartData && chartData.data.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600">Data Points</div>
            <div className="text-lg font-semibold text-gray-900">{chartData.data.length}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600">Normal Range</div>
            <div className="text-sm font-semibold text-gray-900">
              {chartData.range.low} - {chartData.range.high}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600">Current Status</div>
            <div className={`text-sm font-semibold ${parseFloat(selectedMetric?.value || '0') >= chartData.range.low &&
              parseFloat(selectedMetric?.value || '0') <= chartData.range.high
              ? 'text-green-600' : 'text-red-600'
              }`}>
              {parseFloat(selectedMetric?.value || '0') >= chartData.range.low &&
                parseFloat(selectedMetric?.value || '0') <= chartData.range.high
                ? 'Normal' : 'Out of Range'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600">Time Span</div>
            <div className="text-sm font-semibold text-gray-900">
              {(() => {
                if (chartData.data.length < 2) return 'Single point';
                const firstDate = new Date(chartData.data[0].date);
                const lastDate = new Date(chartData.data[chartData.data.length - 1].date);
                const diffMonths = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
                return diffMonths > 0 ? `${diffMonths} months` : 'Recent';
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Dashboard-style chart component
function DashboardStyleChart({ data, color, range, unit, currentValue, isClient, title }: {
  data: any[];
  color: string;
  range: { low: number; high: number };
  unit: string;
  currentValue: number;
  isClient: boolean;
  title: string;
}) {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📈</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Historical Data</h3>
          <p className="text-gray-600 max-w-sm">
            No previous records found for this parameter. Historical trending will be available once you have more lab reports.
          </p>
        </div>
      </div>
    );
  }

  const width = 580;
  const height = 320;
  const padding = { top: 40, right: 70, bottom: 80, left: 70 };

  const values = data.map(d => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);

  // Create a reasonable range that includes both data and reference ranges with proper padding
  const minValue = Math.min(dataMin, range.low) * 0.95;
  const maxValue = Math.max(dataMax, range.high) * 1.05;
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">{title} Trend</h4>
        <div className="text-sm text-gray-600">
          {data.length} data points
        </div>
      </div>

      <div className="relative overflow-hidden bg-white rounded-lg border border-gray-200 p-2">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="mx-auto"
          style={{ maxWidth: '100%', height: 'auto' }}
        >
          {/* Grid */}
          <defs>
            <pattern id="dashboardGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#f8fafc" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dashboardGrid)" />

          {/* Y-axis labels */}
          {(() => {
            // Create 4 evenly spaced Y-axis labels that fit within the chart
            const numLabels = 4;
            const labels = [];
            for (let i = 0; i < numLabels; i++) {
              const value = minValue + (valueRange * i / (numLabels - 1));
              labels.push(value);
            }
            return labels.map((value, i) => (
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
                  className="fill-gray-500 text-xs"
                >
                  {value.toFixed(1)}
                </text>
              </g>
            ));
          })()}

          {/* Normal range background */}
          <rect
            x={padding.left}
            y={getY(range.high)}
            width={width - padding.left - padding.right}
            height={getY(range.low) - getY(range.high)}
            fill={color}
            fillOpacity={0.1}
            rx={3}
          />

          {/* Range labels */}
          <text
            x={width - padding.right + 5}
            y={getY(range.high) - 2}
            className="fill-gray-500 text-xs"
            textAnchor="start"
          >
            H: {range.high}
          </text>
          <text
            x={width - padding.right + 5}
            y={getY(range.low) + 10}
            className="fill-gray-500 text-xs"
            textAnchor="start"
          >
            L: {range.low}
          </text>

          {/* Trend line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((d, i) => {
            const isOutOfRange = d.value < range.low || d.value > range.high;
            const isSelected = selectedPoint === i;
            const isCurrent = Math.abs(d.value - currentValue) < 0.01;

            return (
              <g key={i}>
                <circle
                  cx={getX(i)}
                  cy={getY(d.value)}
                  r={isCurrent ? 8 : isSelected ? 6 : 4}
                  fill={isCurrent ? '#10b981' : isOutOfRange ? "#ef4444" : color}
                  stroke="white"
                  strokeWidth={isCurrent ? 2 : 1.5}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => setSelectedPoint(isSelected ? null : i)}
                />

                {/* Current value indicator */}
                {isCurrent && (
                  <text
                    x={getX(i)}
                    y={getY(d.value) - 15}
                    textAnchor="middle"
                    className="fill-green-600 text-xs font-medium"
                  >
                    Current
                  </text>
                )}

                {/* Selected point tooltip */}
                {isSelected && (
                  <g>
                    <rect
                      x={getX(i) - 45}
                      y={getY(d.value) - 35}
                      width={90}
                      height={25}
                      fill="black"
                      fillOpacity={0.8}
                      rx={3}
                    />
                    <text
                      x={getX(i)}
                      y={getY(d.value) - 18}
                      textAnchor="middle"
                      className="fill-white text-xs"
                    >
                      {d.value.toFixed(2)} {unit}
                    </text>
                  </g>
                )}

                {/* Date labels - smart formatting based on available space */}
                {(i % Math.max(1, Math.floor(data.length / 4)) === 0 || i === data.length - 1) && (
                  <text
                    x={getX(i)}
                    y={height - padding.bottom + 20}
                    textAnchor="middle"
                    className="fill-gray-500 text-xs"
                    transform={`rotate(-35 ${getX(i)} ${height - padding.bottom + 20})`}
                  >
                    {isClient
                      ? (() => {
                        const date = new Date(d.date);
                        // If we have many data points or limited space, show month-year format
                        if (data.length > 6) {
                          return date.toLocaleDateString('en-US', {
                            month: 'short',
                            year: '2-digit'
                          });
                        } else {
                          // For fewer points, show month-day
                          return date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          });
                        }
                      })()
                      : 'Date'
                    }
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex justify-center mt-3 space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
            <span className="text-gray-600">Normal range</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Out of range</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Current value</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReportDetailClient({ report, userId }: { report: any; userId: string }) {
  const [selectedLabMetric, setSelectedLabMetric] = useState<any | null>(null);

  // Parse report data from metrics
  const labs = report.metrics?.filter((m: any) => m.category !== 'imaging') || [];
  const imaging = report.metrics?.filter((m: any) => m.category === 'imaging') || [];

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Handle lab parameter click for trending
  const handleLabClick = (metric: any) => {
    console.log(`🔍 Lab parameter clicked: ${metric.name} = ${metric.value || metric.textValue} ${metric.unit || ''}`);
    setSelectedLabMetric(metric);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/reports"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Medical Report</h1>
                <p className="text-gray-600">
                  {report.reportDate ? formatDate(report.reportDate) : 'No date specified'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <ExportPdfButton reportId={report.id} />
              <DeleteReportButton reportId={report.id} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Report Data */}
          <div className="lg:col-span-3 space-y-6">
            {/* Lab Results Section */}
            {labs.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-b border-emerald-100">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <span className="mr-3 text-2xl">🧪</span>
                    Laboratory Results
                  </h2>
                  <p className="text-gray-600 mt-1">Click any parameter to view trending chart</p>
                </div>

                <div className="p-6">
                  <div className="grid gap-4">
                    {labs.map((lab: any, index: number) => {
                      // Apply unit conversion for display (with safe fallback)
                      const formatted = lab.value ? formatMedicalValue(lab.name, lab.value, lab.unit) : null;

                      return (
                        <div
                          key={index}
                          onClick={() => handleLabClick(lab)}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all cursor-pointer group"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full group-hover:bg-emerald-600 transition-colors"></div>
                            <div>
                              <div className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                                {lab.name}
                                {formatted?.wasConverted && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                    converted
                                  </span>
                                )}
                              </div>
                              {(() => {
                                // 🔧 FIX: Only show textValue if it's NOT JSON metadata
                                if (!lab.textValue || !lab.value) return null;
                                
                                try {
                                  // Try to parse as JSON - if it's our metadata, hide it
                                  const parsed = JSON.parse(lab.textValue);
                                  if (parsed.originalName || parsed.standardized || parsed.parameterFound) {
                                    return null; // Hide JSON metadata from users
                                  }
                                } catch (e) {
                                  // Not JSON, it's a regular text value, show it
                                }
                                
                                return <div className="text-sm text-gray-600">{lab.textValue}</div>;
                              })()}
                              {formatted?.wasConverted && formatted.conversionNote && (
                                <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                  <span>🔧</span>
                                  <span>{formatted.conversionNote}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-bold text-gray-900 text-lg">
                              {formatted ?
                                `${formatted.displayValue} ${formatted.displayUnit}` :
                                `${lab.value || lab.textValue || '—'} ${lab.unit || ''}`
                              }
                            </div>
                            {formatted?.wasConverted && (
                              <div className="text-xs text-gray-500 mt-1">
                                Original: {formatted.originalValue} {lab.unit}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Original Report File Section */}
            {report.objectKey && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <span className="mr-3 text-2xl">📄</span>
                    Original Document
                  </h2>
                  <p className="text-gray-600 mt-1">
                    View and interact with the uploaded file
                  </p>
                </div>

                <div className="p-6">
                  {(() => {
                    const fileName = report.objectKey.split('/').pop() || 'Unknown file';
                    const contentType = report.contentType || '';
                    
                    // Handle batch images or multiple files
                    if (contentType === 'image/batch' || fileName.includes('batch')) {
                      // This is a batch upload - discover and display all related files
                      return (
                        <BatchFileDisplay
                          reportId={report.id}
                          primaryObjectKey={report.objectKey}
                          contentType={contentType}
                        />
                      );
                    }
                    
                    // Regular single file handling
                    if (contentType.includes('image/') || fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
                      return (
                        <FileImageDisplay
                          objectKey={report.objectKey}
                          fileName={fileName}
                          contentType={contentType}
                        />
                      );
                    } else if (contentType.includes('pdf') || fileName.match(/\.pdf$/i)) {
                      return (
                        <FilePdfDisplay
                          objectKey={report.objectKey}
                          fileName={fileName}
                          contentType={contentType}
                        />
                      );
                    } else {
                      return (
                        <FileDownloadDisplay
                          objectKey={report.objectKey}
                          fileName={fileName}
                          contentType={contentType}
                        />
                      );
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Imaging Results Section */}
            {imaging.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <span className="mr-3 text-2xl">🏥</span>
                    Imaging Findings
                  </h2>
                </div>

                <div className="p-6">
                  <div className="grid gap-4">
                    {imaging.map((finding: any, index: number) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-2">
                              {finding.name || `Finding ${index + 1}`}
                            </div>
                            {finding.textValue && (
                              <p className="text-gray-700 mb-3">{finding.textValue}</p>
                            )}
                            {finding.value && (
                              <div className="text-sm text-gray-600">
                                <strong>Value:</strong> {finding.value} {finding.unit || ''}
                              </div>
                            )}
                          </div>

                          <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {finding.category || 'Imaging'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {labs.length === 0 && imaging.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📄</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Structured Data</h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  This report doesn't contain structured lab or imaging data.
                  The original document may contain unstructured information.
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Trending Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2 text-xl">📈</span>
                Parameter Trending
              </h3>

              <LabTrendingChart
                currentMetrics={labs}
                userId={userId}
                selectedMetric={selectedLabMetric}
              />
            </div>
          </div>
        </div>

        {/* Report Summary */}
        {(labs.length > 0 || imaging.length > 0) && (
          <div className="mt-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2 text-xl">📋</span>
                Report Summary
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <span className="text-emerald-600 text-lg">🧪</span>
                    </div>
                    <h4 className="font-semibold text-gray-900">Laboratory Data</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      <strong>{labs.length}</strong> lab parameters analyzed
                    </p>
                    {labs.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Key metrics include {labs.slice(0, 3).map((lab: any) => lab.name).join(', ')}
                        {labs.length > 3 && ` and ${labs.length - 3} more`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-lg">🏥</span>
                    </div>
                    <h4 className="font-semibold text-gray-900">Imaging Data</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      <strong>{imaging.length}</strong> imaging findings documented
                    </p>
                    {imaging.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Findings include detailed analysis of anatomical structures and abnormalities
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mt-0.5">
                    <span className="text-blue-600 text-sm">ℹ️</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Clinical Overview</h5>
                    <p className="text-sm text-gray-600">
                      This report contains {labs.length} lab values and {imaging.length} imaging findings.
                      {labs.length > 0 && imaging.length > 0 && " This comprehensive report provides both laboratory and imaging data for complete clinical assessment."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left">
              <span className="text-2xl">📄</span>
              <div>
                <div className="font-medium text-gray-900">View Original</div>
                <div className="text-sm text-gray-600">See the raw PDF document</div>
              </div>
            </button>

            <button className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-left">
              <span className="text-2xl">📧</span>
              <div>
                <div className="font-medium text-gray-900">Share</div>
                <div className="text-sm text-gray-600">Send to your doctor</div>
              </div>
            </button>

            <button className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-left">
              <span className="text-2xl">📊</span>
              <div>
                <div className="font-medium text-gray-900">View Trends</div>
                <div className="text-sm text-gray-600">See how values changed</div>
              </div>
            </button>

            <button className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors text-left">
              <span className="text-2xl">💾</span>
              <div>
                <div className="font-medium text-gray-900">Download</div>
                <div className="text-sm text-gray-600">Get PDF summary</div>
              </div>
            </button>
          </div>
        </div>

        {/* Report Metadata */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Report Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <span className="font-medium text-gray-700">Report Type:</span>
              <div className="text-gray-900">{report.reportType || 'Unknown'}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Report Date:</span>
              <div className="text-gray-900">
                {report.reportDate ? formatDate(report.reportDate) : 'No date specified'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">File:</span>
              <div className="text-gray-900 truncate">{report.objectKey}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}