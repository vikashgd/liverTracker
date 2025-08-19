"use client";

import { useMemo, useState, useEffect } from "react";
import { SeriesPoint } from "@/components/trend-chart";
import { CanonicalMetric } from "@/lib/metrics";

type ChartSpec = { 
  title: CanonicalMetric; 
  color: string; 
  data: SeriesPoint[]; 
  range: { low: number; high: number }; 
  unit: string;
};

export default function EnhancedDashboardCharts({ charts }: { charts: ChartSpec[] }) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y' | 'all'>('all');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getTimeRangeCutoff = (range: string): Date | null => {
    if (range === 'all') return null;
    const now = new Date();
    const daysMap = { '3m': 90, '6m': 180, '1y': 365 };
    const days = daysMap[range as keyof typeof daysMap];
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  };

  const filteredCharts = useMemo(() => {
    const cutoffDate = isClient ? getTimeRangeCutoff(timeRange) : null;
    
    return charts.map((chart) => ({
      ...chart,
      data: chart.data.filter((d) => {
        if (!cutoffDate) return true;
        return new Date(d.date) >= cutoffDate;
      }),
    }));
  }, [charts, timeRange, isClient]);

  const selectedChart = selectedMetric 
    ? filteredCharts.find(c => c.title === selectedMetric) 
    : null;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                📈 Advanced Chart Analysis
              </h2>
              <p className="text-lg text-gray-600">
                Interactive time-series visualization with enhanced insights
              </p>
            </div>
            
            {/* Time Range Selector */}
            <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
              <div className="flex gap-1">
                {(['3m', '6m', '1y', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      timeRange === range
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {range === 'all' ? 'All Time' : range.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Metrics Grid */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              📊 Health Metrics
            </h3>
            {filteredCharts
              .filter(chart => chart.data.length > 0)
              .map((chart) => {
                const validData = chart.data.filter((d): d is SeriesPoint & { value: number } => d.value !== null);
                const latest = validData[validData.length - 1];
                const previous = validData[validData.length - 2];
                
                if (!latest) return null;

                const isSelected = selectedMetric === chart.title;
                const trend = previous && latest 
                  ? latest.value! > previous.value! ? 'up' : latest.value! < previous.value! ? 'down' : 'stable'
                  : 'stable';

                const isNormal = latest.value! >= chart.range.low && latest.value! <= chart.range.high;
                
                return (
                  <div
                    key={chart.title}
                    onClick={() => setSelectedMetric(isSelected ? null : chart.title)}
                    className={`
                      relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }
                    `}
                  >
                    {/* Metric Header */}
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900">{chart.title}</h4>
                      <div className="flex items-center space-x-2">
                        {/* Trend Indicator */}
                        <span className={`text-lg ${
                          trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➖'
                        }`} />
                        {/* Status Dot */}
                        <div className={`w-3 h-3 rounded-full ${
                          isNormal ? 'bg-green-500' : 'bg-red-500 animate-pulse'
                        }`} />
                      </div>
                    </div>

                    {/* Latest Value */}
                    <div className="mb-2">
                      <span className={`text-2xl font-bold ${
                        isNormal ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {latest.value}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">{chart.unit}</span>
                    </div>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isNormal 
                        ? 'bg-green-100 text-green-800' 
                        : latest.value! > chart.range.high 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                    }`}>
                      {isNormal ? '✅ Normal' : latest.value! > chart.range.high ? '⬆️ High' : '⬇️ Low'}
                    </div>

                    {/* Data Points Count */}
                    <div className="mt-2 text-xs text-gray-500">
                      {validData.length} reading{validData.length !== 1 ? 's' : ''}
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Chart Display Area */}
          <div className="lg:col-span-3">
            {selectedChart ? (
              <DetailedChartView chart={selectedChart} />
            ) : (
              <EmptyChartState />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailedChartView({ chart }: { chart: ChartSpec }) {
  const validData = chart.data.filter((d): d is SeriesPoint & { value: number } => d.value !== null);
  const latest = validData[validData.length - 1];
  
  if (!latest) return <EmptyChartState />;

  const min = Math.min(...validData.map(d => d.value));
  const max = Math.max(...validData.map(d => d.value));
  const avg = validData.reduce((sum, d) => sum + d.value, 0) / validData.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{chart.title}</h3>
          <p className="text-gray-600">Time series analysis • {validData.length} data points</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Latest Value</div>
            <div className="text-2xl font-bold text-blue-600">
              {latest.value} <span className="text-lg text-gray-500">{chart.unit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Chart */}
      <div className="mb-6">
        <InteractiveChart 
          data={validData} 
          range={chart.range} 
          unit={chart.unit}
          color={chart.color}
        />
      </div>

      {/* Statistics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          label="Current" 
          value={latest.value!} 
          unit={chart.unit}
          color="blue"
        />
        <StatCard 
          label="Average" 
          value={avg} 
          unit={chart.unit}
          color="green"
        />
        <StatCard 
          label="Highest" 
          value={max} 
          unit={chart.unit}
          color="purple"
        />
        <StatCard 
          label="Lowest" 
          value={min} 
          unit={chart.unit}
          color="orange"
        />
      </div>

      {/* Reference Range */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Reference Range</h4>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Normal Range:</span>
          <span className="font-medium">
            {chart.range.low} - {chart.range.high} {chart.unit}
          </span>
        </div>
      </div>
    </div>
  );
}

function InteractiveChart({ 
  data, 
  range, 
  unit, 
  color 
}: { 
  data: (SeriesPoint & { value: number })[], 
  range: { low: number; high: number }, 
  unit: string,
  color: string 
}) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (data.length === 0) return null;

  const minValue = Math.min(...data.map(d => d.value), range.low);
  const maxValue = Math.max(...data.map(d => d.value), range.high);
  const padding = (maxValue - minValue) * 0.1;
  const chartMin = minValue - padding;
  const chartMax = maxValue + padding;

  const getY = (value: number) => {
    return 200 - ((value - chartMin) / (chartMax - chartMin)) * 180;
  };

  const getX = (index: number) => {
    if (data.length <= 1) {
      return 400; // Center position for single data point
    }
    return 40 + (index / (data.length - 1)) * 720;
  };

  // Create path for line chart
  const pathData = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`).join(' ');

  return (
    <div className="relative">
      <svg width="800" height="240" className="border border-gray-200 rounded-lg bg-white">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Reference range area */}
        <rect
          x="40"
          y={getY(range.high)}
          width="720"
          height={getY(range.low) - getY(range.high)}
          fill="rgba(34, 197, 94, 0.1)"
          stroke="rgba(34, 197, 94, 0.3)"
          strokeWidth="1"
          strokeDasharray="5,5"
        />

        {/* Line chart */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => {
          const isNormal = d.value >= range.low && d.value <= range.high;
          const isHovered = hoveredPoint === i;
          
          return (
            <g key={i}>
              <circle
                cx={getX(i)}
                cy={getY(d.value)}
                r={isHovered ? 8 : 6}
                fill={isNormal ? '#22c55e' : '#ef4444'}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              
              {/* Tooltip */}
              {isHovered && (
                <g>
                  <rect
                    x={getX(i) - 40}
                    y={getY(d.value) - 50}
                    width="80"
                    height="35"
                    fill="rgba(0, 0, 0, 0.8)"
                    rx="4"
                  />
                  <text
                    x={getX(i)}
                    y={getY(d.value) - 35}
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {d.value} {unit}
                  </text>
                  <text
                    x={getX(i)}
                    y={getY(d.value) - 22}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                  >
{isClient ? new Date(d.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    }) : 'Date'}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Y-axis labels */}
        <text x="30" y={getY(range.high)} textAnchor="end" fontSize="10" fill="#6b7280">
          {range.high}
        </text>
        <text x="30" y={getY(range.low)} textAnchor="end" fontSize="10" fill="#6b7280">
          {range.low}
        </text>
      </svg>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  unit, 
  color 
}: { 
  label: string; 
  value: number; 
  unit: string; 
  color: string 
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-sm font-medium opacity-80">{label}</div>
      <div className="text-xl font-bold">
        {value.toFixed(1)} <span className="text-sm opacity-70">{unit}</span>
      </div>
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center">
      <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <span className="text-4xl">📊</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Select a Health Metric
      </h3>
      <p className="text-gray-600 max-w-md mx-auto">
        Choose any metric from the list on the left to view detailed analysis, 
        interactive charts, and comprehensive insights about your health data.
      </p>
    </div>
  );
}
