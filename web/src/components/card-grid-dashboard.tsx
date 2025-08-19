"use client";

import { useMemo, useState, useEffect } from "react";
import { SeriesPoint } from "@/components/trend-chart";
import { CanonicalMetric } from "@/lib/metrics";
import MetricDetailModal from "./metric-detail-modal";

type ChartSpec = { 
  title: CanonicalMetric; 
  color: string; 
  data: SeriesPoint[]; 
  range: { low: number; high: number }; 
  unit: string;
};

interface MetricCardProps {
  chart: ChartSpec;
  onClick: () => void;
  isClient: boolean;
}

function MiniChart({ data, color, range }: { data: SeriesPoint[], color: string, range: { low: number; high: number } }) {
  if (data.length === 0) return <div className="text-gray-400 text-sm">No data</div>;

  const validData = data.filter((d): d is SeriesPoint & { value: number } => d.value !== null && d.value !== undefined);
  if (validData.length === 0) return <div className="text-gray-400 text-sm">No valid data</div>;

  // Simple sparkline SVG
  const width = 120;
  const height = 40;
  const padding = 4;

  const values = validData.map(d => d.value);
  const minValue = Math.min(...values, range.low);
  const maxValue = Math.max(...values, range.high);
  const valueRange = maxValue - minValue;

  const getY = (value: number) => {
    if (valueRange === 0) return height / 2;
    return height - padding - ((value - minValue) / valueRange) * (height - 2 * padding);
  };

  const getX = (index: number) => {
    if (validData.length === 1) return width / 2;
    return padding + (index / (validData.length - 1)) * (width - 2 * padding);
  };

  // Create path for line chart
  const pathData = validData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`).join(' ');

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
        {/* Background grid lines */}
        <defs>
          <pattern id="grid" width="20" height="10" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 10" fill="none" stroke="#f1f5f9" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Normal range indicator */}
        <rect
          x={padding}
          y={getY(range.high)}
          width={width - 2 * padding}
          height={getY(range.low) - getY(range.high)}
          fill={color}
          fillOpacity={0.1}
          rx={2}
        />
        
        {/* Chart line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {validData.map((d, i) => {
          const isOutOfRange = d.value < range.low || d.value > range.high;
          return (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(d.value)}
              r={3}
              fill={isOutOfRange ? "#ef4444" : color}
              stroke="white"
              strokeWidth={1}
            />
          );
        })}
      </svg>
    </div>
  );
}

function MetricCard({ chart, onClick, isClient }: MetricCardProps) {
  const validData = chart.data.filter((d): d is SeriesPoint & { value: number } => d.value !== null && d.value !== undefined);
  const latestData = validData[validData.length - 1];
  
  if (!latestData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-gray-400">No data available for {chart.title}</div>
      </div>
    );
  }

  const isHigh = latestData.value > chart.range.high;
  const isLow = latestData.value < chart.range.low;
  const isNormal = !isHigh && !isLow;

  const getStatusColor = () => {
    if (isHigh) return "text-red-600 bg-red-50 border-red-200";
    if (isLow) return "text-red-600 bg-red-50 border-red-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getStatusText = () => {
    if (isHigh) return "High";
    if (isLow) return "Low";
    return "Normal";
  };

  const getTrend = () => {
    if (validData.length < 2) return null;
    const prev = validData[validData.length - 2];
    const current = latestData;
    const change = ((current.value - prev.value) / prev.value) * 100;
    
    if (Math.abs(change) < 5) return { icon: "→", text: "Stable", color: "text-gray-500" };
    if (change > 0) return { icon: "↗", text: `+${change.toFixed(1)}%`, color: "text-green-600" };
    return { icon: "↘", text: `${change.toFixed(1)}%`, color: "text-red-600" };
  };

  const trend = getTrend();

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 
        transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800 text-lg">{chart.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            {trend && (
              <span className={`text-sm flex items-center gap-1 ${trend.color}`}>
                <span>{trend.icon}</span>
                <span>{trend.text}</span>
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {latestData.value.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">{chart.unit}</div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="mb-4">
        <MiniChart data={chart.data} color={chart.color} range={chart.range} />
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Range</div>
          <div className="text-sm font-medium text-gray-700">
            {chart.range.low}-{chart.range.high}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Records</div>
          <div className="text-sm font-medium text-gray-700">{validData.length}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Last</div>
          <div className="text-sm font-medium text-gray-700">
            {isClient 
              ? new Date(latestData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'Recent'
            }
          </div>
        </div>
      </div>


    </div>
  );
}



export default function CardGridDashboard({ charts }: { charts: ChartSpec[] }) {
  const [selectedChart, setSelectedChart] = useState<ChartSpec | null>(null);
  const [timeFilter, setTimeFilter] = useState<'3m' | '6m' | '1y' | 'all'>('all');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredCharts = useMemo(() => {
    if (timeFilter === 'all') return charts;
    
    const cutoffDate = new Date();
    const daysMap = { '3m': 90, '6m': 180, '1y': 365 };
    cutoffDate.setDate(cutoffDate.getDate() - daysMap[timeFilter]);
    
    return charts.map(chart => ({
      ...chart,
      data: chart.data.filter(d => new Date(d.date) >= cutoffDate)
    }));
  }, [charts, timeFilter]);

  // Group charts by priority
  const criticalMetrics = filteredCharts.filter(chart => 
    ['Bilirubin', 'Creatinine', 'INR'].includes(chart.title)
  );
  
  const liverMetrics = filteredCharts.filter(chart => 
    ['ALT', 'AST', 'Platelets', 'Albumin'].includes(chart.title)
  );
  
  const additionalMetrics = filteredCharts.filter(chart => 
    ['ALP', 'GGT', 'TotalProtein', 'Sodium', 'Potassium'].includes(chart.title)
  );

  return (
    <div className="bg-gray-50 rounded-lg">
      {/* Time Filter */}
      <div className="flex justify-end mb-6">
        <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
          {['3m', '6m', '1y', 'all'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeFilter(period as any)}
              className={`
                px-3 py-2 rounded-md text-sm font-medium transition-all
                ${timeFilter === period 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {period === 'all' ? 'All Time' : period.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Cards */}
      <div className="space-y-8">
        {/* Critical Metrics */}
        {criticalMetrics.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              🚨 Critical Health Indicators
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {criticalMetrics.map((chart) => (
                <MetricCard
                  key={chart.title}
                  chart={chart}
                  onClick={() => setSelectedChart(chart)}
                  isClient={isClient}
                />
              ))}
            </div>
          </section>
        )}

        {/* Liver Function Panel */}
        {liverMetrics.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              🧪 Liver Function Panel
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {liverMetrics.map((chart) => (
                <MetricCard
                  key={chart.title}
                  chart={chart}
                  onClick={() => setSelectedChart(chart)}
                  isClient={isClient}
                />
              ))}
            </div>
          </section>
        )}

        {/* Additional Health Markers */}
        {additionalMetrics.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              📊 Additional Health Markers
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {additionalMetrics.map((chart) => (
                <MetricCard
                  key={chart.title}
                  chart={chart}
                  onClick={() => setSelectedChart(chart)}
                  isClient={isClient}
                />
              ))}
            </div>
          </section>
        )}
      </div>
      
      {/* Modal for detailed analysis */}
      <MetricDetailModal
        chart={selectedChart}
        isOpen={selectedChart !== null}
        onClose={() => setSelectedChart(null)}
      />
    </div>
  );
}
