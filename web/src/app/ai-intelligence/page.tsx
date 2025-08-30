import { canonicalizeMetricName, metricColors, referenceRanges, type CanonicalMetric } from "@/lib/metrics";
import { getMedicalPlatform } from "@/lib/medical-platform";
import type { SeriesPoint } from "@/components/trend-chart";
import { requireAuth } from "@/lib/auth";
import { UnifiedAIIntelligenceDashboard } from "@/components/unified-ai-intelligence-dashboard";
import { prisma } from "@/lib/db";

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

export default async function AIIntelligencePage() {
  const userId = await requireAuth();

  console.log(`🤖 AI Intelligence loading for user: ${userId}`);

  // Load all metric data using the Medical Platform (same as dashboard)
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

  // Create chart specifications for the client (same format as dashboard)
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

  // Fetch patient profile for AI context
  const patientProfile = await prisma.patientProfile.findUnique({
    where: { userId },
  });

  // Convert patient profile to the expected format
  const patientData = patientProfile ? {
    age: patientProfile.dateOfBirth ? 
      Math.floor((Date.now() - patientProfile.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 
      undefined,
    gender: patientProfile.gender || undefined,
    weight: patientProfile.weight || undefined,
    height: patientProfile.height || undefined,
    // Note: These fields don't exist in the current schema, removing them
    // medicalHistory: patientProfile.medicalHistory || undefined,
    // medications: patientProfile.medications || undefined,
    // allergies: patientProfile.allergies || undefined,
    // lifestyle: patientProfile.lifestyle || undefined,
  } : undefined;

  return (
    <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Health Intelligence</h1>
          <p className="text-gray-600">
            Advanced AI-powered analysis of your health data with predictive insights and personalized recommendations.
          </p>
        </div>

        <UnifiedAIIntelligenceDashboard 
          charts={charts}
          patientProfile={patientProfile as any || undefined}
          patientData={patientData as any}
        />
      </div>
    </div>
  );
}

