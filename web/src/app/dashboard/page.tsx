import { canonicalizeMetricName, metricColors, referenceRanges, type CanonicalMetric } from "@/lib/metrics";
import { getMedicalPlatform } from "@/lib/medical-platform";
import type { SeriesPoint } from "@/components/trend-chart";
import { ExportSummaryButton } from "@/components/export-summary-button";
import { requireAuth } from "@/lib/auth";
import DashboardClient from "./dashboard-client";
import { MedicalDashboardOverview } from "@/components/medical-dashboard-overview";
import { WorldClassDashboard } from "@/components/world-class/world-class-dashboard";
import CardGridDashboard from "@/components/card-grid-dashboard";

/**
 * Load chart data for a specific metric using the Medical Platform
 */
async function loadSeries(userId: string, metric: CanonicalMetric): Promise<SeriesPoint[]> {
  try {
    console.log(`📊 Loading ${metric} data using Medical Platform...`);
    
    // Initialize medical platform
    const platform = getMedicalPlatform({
      processing: {
        strictMode: false,
        autoCorrection: true,
        confidenceThreshold: 0.5,
        validationLevel: 'normal'
      },
      quality: {
        minimumConfidence: 0.3,
        requiredFields: [],
        outlierDetection: true,
        duplicateHandling: 'merge'
      },
      regional: {
        primaryUnits: 'International',
        timeZone: 'UTC',
        locale: 'en-US'
      },
      compliance: {
        auditLevel: 'basic',
        dataRetention: 2555,
        encryptionRequired: false
      }
    });

    // Get chart data using the new repository
    const chartSeries = await platform.getChartData(userId, metric);
    
    // Convert to expected SeriesPoint format
    const seriesData: SeriesPoint[] = chartSeries.data.map(point => ({
      date: point.date.toISOString().split('T')[0],
      value: point.value,
      reportCount: (point.metadata as any)?.reportCount
    }));

    // Enhanced debug logging
    const emoji = {
      'Platelets': '🩸', 'ALT': '🧪', 'AST': '🧪', 'Bilirubin': '🟡',
      'Albumin': '🔵', 'Creatinine': '🔴', 'INR': '🩸', 'ALP': '⚗️',
      'GGT': '🔬', 'TotalProtein': '🟢', 'Sodium': '🧂', 'Potassium': '🍌'
    }[metric] || '📊';
    
    console.log(`${emoji} ${metric.toUpperCase()} MEDICAL PLATFORM DEBUG:`, {
      metric,
      dataCount: seriesData.length,
      statistics: chartSeries.statistics,
      quality: {
        completeness: chartSeries.quality.completeness.toFixed(2),
        reliability: chartSeries.quality.reliability.toFixed(2),
        gaps: chartSeries.quality.gaps.length
      },
      sampleData: seriesData.slice(0, 3),
      valueRange: chartSeries.statistics.count > 0 ? {
        min: chartSeries.statistics.min,
        max: chartSeries.statistics.max,
        average: chartSeries.statistics.average.toFixed(1)
      } : null,
      trend: chartSeries.statistics.trend,
      source: 'medical_platform_v1'
    });
    
    return seriesData;
    
  } catch (error) {
    console.error(`❌ Error loading ${metric} data:`, error);
    
    // Fallback to empty data rather than crashing
    console.log(`⚠️ Returning empty data for ${metric} due to error`);
    return [];
  }
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const userId = user.id;

  console.log(`🏠 Dashboard loading for user: ${userId}`);

  // Load all metric data using the Medical Platform
  const allMetrics: CanonicalMetric[] = [
    'ALT', 'AST', 'Platelets', 'Bilirubin', 'Albumin', 'Creatinine', 
    'INR', 'ALP', 'GGT', 'TotalProtein', 'Sodium', 'Potassium'
  ];

  console.log(`📊 Loading data for ${allMetrics.length} metrics using Medical Platform...`);

  const chartData = await Promise.all(
    allMetrics.map(async (metric) => {
      const data = await loadSeries(userId, metric);
      return { metric, data };
    })
  );

  console.log(`✅ Medical Platform loaded data for ${chartData.length} metrics:`, 
    chartData.map(({ metric, data }) => ({ 
      metric, 
      points: data.length,
      source: 'medical_platform_v1'
    }))
  );

  // Create chart specifications for the client
  const charts = chartData.map(({ metric, data }) => {
    const ranges = referenceRanges[metric];
    
    return {
      title: metric as CanonicalMetric,
      color: metricColors[metric] || '#8B5CF6',
      data,
      range: {
        low: ranges?.low ?? 0,
        high: ranges?.high ?? 100
      },
      unit: ranges?.unit || '',
      platform: 'medical_platform_v1'
    };
  });

  return (
    <>
      {/* Keep the beautiful World-Class Dashboard from yesterday */}
      <WorldClassDashboard charts={charts} />

      {/* Only replace the bottom charts with card grid */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              📊 Interactive Chart Analysis
            </h2>
            <p className="text-base text-gray-600">
              Click any metric card above for detailed analysis, or explore all metrics below
            </p>
          </div>
          <CardGridDashboard charts={charts} />
        </div>
      </div>
    </>
  );
}
