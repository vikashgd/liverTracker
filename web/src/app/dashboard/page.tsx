import { prisma } from "@/lib/db";
import { canonicalizeMetricName, metricColors, referenceRanges, type CanonicalMetric } from "@/lib/metrics";
import { UnifiedMedicalEngine, UNIFIED_MEDICAL_PARAMETERS } from "@/lib/unified-medical-engine";
import { SmartReportManager } from "@/lib/smart-report-manager";
import type { SeriesPoint } from "@/components/trend-chart";
import { ExportSummaryButton } from "@/components/export-summary-button";
import { requireAuth } from "@/lib/auth";
import DashboardClient from "./dashboard-client";


async function loadSeries(userId: string, metric: CanonicalMetric): Promise<SeriesPoint[]> {
  // Get parameter definition from unified engine
  const parameter = UNIFIED_MEDICAL_PARAMETERS[metric];
  if (!parameter) {
    console.log(`❌ Unknown parameter: ${metric}`);
    return [];
  }
  
  // Use comprehensive synonym list from unified engine
  const allPossibleNames = [...new Set([metric, ...parameter.synonyms])];
  
  console.log(`📊 Loading ${metric} data. Searching for names:`, allPossibleNames);
  
  const rows = await prisma.extractedMetric.findMany({
    where: { 
      report: { userId }, 
      name: { in: allPossibleNames } 
    },
    orderBy: { createdAt: "asc" },
    select: { 
      value: true, 
      unit: true, 
      name: true, // Include name for debugging
      report: { select: { reportDate: true, createdAt: true } } 
    },
    take: 500,
  });
  
  console.log(`📊 Found ${rows.length} raw records for ${metric}:`, 
    rows.map(r => ({name: r.name, value: r.value, unit: r.unit}))
  );
  
  // Prepare data for unified medical engine
  const rawDataForEngine = rows
    .filter(r => r.value !== null)
    .map(r => ({
      metric,
      value: r.value!,
      unit: r.unit,
      date: (r.report.reportDate ?? r.report.createdAt).toISOString().slice(0, 10),
      reportId: 'legacy' // We don't have reportId in this context
    }));
  
  // Get deduplicated chart data using smart report manager
  const deduplicatedData = await SmartReportManager.getDeduplicatedChartData(userId, metric);
  
  // Convert to expected SeriesPoint format
  const seriesData: SeriesPoint[] = deduplicatedData.map(point => ({
    date: point.date,
    value: point.value
  }));
  
  // Enhanced debug logging using unified engine
  if (rawDataForEngine.length > 0) {
    const emoji = {
      'Platelets': '🩸', 'ALT': '🧪', 'AST': '🧪', 'Bilirubin': '🟡',
      'Albumin': '🔵', 'Creatinine': '🔴', 'INR': '🩸', 'ALP': '⚗️',
      'GGT': '🔬', 'TotalProtein': '🟢', 'Sodium': '🧂', 'Potassium': '🍌'
    }[metric] || '📊';
    
    // Process a sample for debugging
    const sampleProcessed = rawDataForEngine.slice(0, 3).map(point => 
      UnifiedMedicalEngine.processValue(metric, point.value, point.unit)
    );
    
    console.log(`${emoji} ${metric.toUpperCase()} UNIFIED ENGINE DEBUG:`, {
      metric,
      rawDataCount: rawDataForEngine.length,
      chartDataCount: seriesData.length,
      parameter: {
        standardUnit: parameter.standardUnit,
        normalRange: parameter.normalRange,
        category: parameter.category
      },
      sampleRawData: rawDataForEngine.slice(0, 3),
      sampleProcessedData: sampleProcessed,
      sampleChartData: seriesData.slice(0, 3),
      unitsSeen: [...new Set(rawDataForEngine.map(d => d.unit))],
      valueRange: rawDataForEngine.length > 0 ? {
        min: Math.min(...rawDataForEngine.map(d => d.value)),
        max: Math.max(...rawDataForEngine.map(d => d.value))
      } : null,
      deduplicatedStats: {
        originalDataPoints: rawDataForEngine.length,
        deduplicatedPoints: deduplicatedData.length,
        duplicatesRemoved: rawDataForEngine.length - deduplicatedData.length,
        confidenceBreakdown: {
          high: deduplicatedData.filter(d => d.confidence === 'high').length,
          medium: deduplicatedData.filter(d => d.confidence === 'medium').length,
          low: deduplicatedData.filter(d => d.confidence === 'low').length
        },
        multiReportDates: deduplicatedData.filter(d => d.reportCount > 1).length
      }
    });
  }

  return seriesData;
}

export default async function DashboardPage() {
  const userId = await requireAuth();
  
  const [alt, ast, platelets, bilirubin, albumin, creatinine, inr, alp, ggt, totalProtein, sodium, potassium] = await Promise.all([
    loadSeries(userId, "ALT"),
    loadSeries(userId, "AST"),
    loadSeries(userId, "Platelets"),
    loadSeries(userId, "Bilirubin"),
    loadSeries(userId, "Albumin"),
    loadSeries(userId, "Creatinine"),
    loadSeries(userId, "INR"),
    loadSeries(userId, "ALP"),
    loadSeries(userId, "GGT"),
    loadSeries(userId, "TotalProtein"),
    loadSeries(userId, "Sodium"),
    loadSeries(userId, "Potassium"),
  ]);

  // Build charts using unified parameter definitions
  const chartData = [
    { metric: "Bilirubin" as CanonicalMetric, data: bilirubin },
    { metric: "Creatinine" as CanonicalMetric, data: creatinine },
    { metric: "INR" as CanonicalMetric, data: inr },
    { metric: "ALT" as CanonicalMetric, data: alt },
    { metric: "AST" as CanonicalMetric, data: ast },
    { metric: "Albumin" as CanonicalMetric, data: albumin },
    { metric: "Platelets" as CanonicalMetric, data: platelets },
    { metric: "ALP" as CanonicalMetric, data: alp },
    { metric: "GGT" as CanonicalMetric, data: ggt },
    { metric: "TotalProtein" as CanonicalMetric, data: totalProtein },
    { metric: "Sodium" as CanonicalMetric, data: sodium },
    { metric: "Potassium" as CanonicalMetric, data: potassium },
  ];

  const allCharts = chartData.map(({ metric, data }) => {
    const parameter = UNIFIED_MEDICAL_PARAMETERS[metric];
    return {
      title: metric,
      color: metricColors[metric] || '#8B5CF6',
      data,
      range: { 
        low: parameter.normalRange.min, 
        high: parameter.normalRange.max 
      },
      unit: parameter.standardUnit
    };
  });

  const charts = allCharts.filter(chart => chart.data.length > 0); // Only show charts with data

  // Calculate latest values and status for metric cards
  const getLatestMetric = (data: SeriesPoint[], range: { low: number; high: number }) => {
    const latestPoint = data[data.length - 1];
    if (!latestPoint?.value) return null;
    
    const value = latestPoint.value;
    let status: 'normal' | 'abnormal' | 'borderline' = 'normal';
    
    if (value < range.low * 0.8 || value > range.high * 1.2) {
      status = 'abnormal';
    } else if (value < range.low || value > range.high) {
      status = 'borderline';
    }
    
    return {
      value,
      status,
      date: latestPoint.date,
    };
  };

  return (
    <div className="min-h-screen bg-medical-neutral-50">
      <div className="medical-layout-container py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-medical-neutral-900 mb-2">
                Health Dashboard
              </h1>
              <p className="text-medical-neutral-600">
                Track your liver health metrics with medical-grade insights
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <ExportSummaryButton userId={userId} />
            </div>
          </div>
        </div>

        {/* Quick Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {charts.map((chart) => {
            const latest = getLatestMetric(chart.data, chart.range);
            return latest ? (
              <div
                key={chart.title}
                className="medical-card-metric hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="metric-label">{chart.title}</h3>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      latest.status === 'normal'
                        ? 'bg-medical-success-500'
                        : latest.status === 'borderline'
                        ? 'bg-medical-warning-500'
                        : 'bg-medical-error-500'
                    }`}
                  />
                </div>
                <div className="metric-value text-medical-neutral-900 mb-1">
                  {latest.value.toFixed(1)}
                  <span className="metric-unit">{chart.unit}</span>
                </div>
                <div className="text-xs text-medical-neutral-500">
                  {latest.date}
                </div>
              </div>
            ) : (
              <div
                key={chart.title}
                className="medical-card-metric bg-medical-neutral-100"
              >
                <h3 className="metric-label mb-2">{chart.title}</h3>
                <div className="text-medical-neutral-400 text-sm">No data</div>
              </div>
            );
          })}
        </div>

        {/* Detailed Charts Section */}
        <div className="medical-card-primary">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-medical-neutral-900">
              Trend Analysis
            </h2>
            <div className="flex items-center space-x-2 text-sm text-medical-neutral-500">
              <div className="w-3 h-3 bg-medical-success-200 rounded"></div>
              <span>Normal Range</span>
            </div>
          </div>
          <DashboardClient charts={charts} />
        </div>
      </div>
    </div>
  );
}


