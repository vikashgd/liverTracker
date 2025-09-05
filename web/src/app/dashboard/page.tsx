import { canonicalizeMetricName, metricColors, referenceRanges, type CanonicalMetric } from "@/lib/metrics";
import { getMedicalPlatform } from "@/lib/medical-platform";
import type { SeriesPoint } from "@/components/trend-chart";
import { ExportSummaryButton } from "@/components/export-summary-button";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { wakeDatabase } from "@/lib/db-warmup";
import DashboardClient from "./dashboard-client";
import { MedicalDashboardOverview } from "@/components/medical-dashboard-overview";
import { WorldClassDashboard } from "@/components/world-class/world-class-dashboard";
import CardGridDashboard from "@/components/card-grid-dashboard";
import { UnifiedAIIntelligenceDashboard } from "@/components/unified-ai-intelligence-dashboard";
import AdvancedMedicalDashboard from "@/components/advanced-medical-dashboard";
import { AutoCalculatedMedicalDashboard } from "@/components/auto-calculated-medical-dashboard";
import { EnhancedImagingDashboard } from "@/components/enhanced-imaging-dashboard";
import Link from "next/link";

/**
 * Load chart data for a specific metric using the Medical Platform
 */
async function loadSeries(userId: string, metric: CanonicalMetric): Promise<SeriesPoint[]> {
  try {
    // Simplified loading with timeout
    const timeoutPromise = new Promise<SeriesPoint[]>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    const loadPromise = (async () => {
      // Initialize medical platform with same config as chart API
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
      return chartSeries.data.map(point => ({
        date: point.date.toISOString().split('T')[0],
        value: point.value,
        reportCount: (point.metadata as any)?.reportCount
      }));
    })();

    return await Promise.race([loadPromise, timeoutPromise]);
    
  } catch (error) {
    // Fast fallback to empty data
    return [];
  }
}

export default async function DashboardPage() {
  const userId = await requireAuth();

  console.log(`🏠 Dashboard loading for user: ${userId}`);

  // Check if user has any reports with better error handling
  let reportCount = 0;
  try {
    // Wake up database first if it's sleeping
    console.log('🔄 Ensuring database is awake...');
    await wakeDatabase();
    
    // Query with longer timeout since database might need time to wake up
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 15000)
    );
    
    const countPromise = prisma.reportFile.count({
      where: { userId }
    });
    
    reportCount = await Promise.race([countPromise, timeoutPromise]);
    console.log(`📊 User ${userId} has ${reportCount} reports`);
  } catch (error) {
    console.error('Error counting reports:', error);
    // Default to 0 reports (new user) if there's an error
    // This ensures the onboarding flow still works even with DB issues
    reportCount = 0;
    console.log(`⚠️ Using fallback: treating user as new user (0 reports)`);
  }

  // If no reports, show onboarding state in dashboard
  const isNewUser = reportCount === 0;

  // Load essential metrics first for faster loading - including Creatinine which is critical
  const essentialMetrics: CanonicalMetric[] = [
    'ALT', 'AST', 'Bilirubin', 'Platelets', 'Creatinine', 'Albumin', 'INR'
  ];

  console.log(`📊 Loading ${essentialMetrics.length} essential metrics for faster dashboard...`);

  // Load essential metrics first
  const chartData = await Promise.all(
    essentialMetrics.map(async (metric) => {
      const data = await loadSeries(userId, metric);
      return { metric, data };
    })
  );

  // Add empty data for other metrics to prevent UI breaks
  const allMetrics: CanonicalMetric[] = [
    'ALT', 'AST', 'Platelets', 'Bilirubin', 'Albumin', 'Creatinine', 
    'INR', 'ALP', 'GGT', 'TotalProtein', 'Sodium', 'Potassium'
  ];

  // Fill in missing metrics with empty data
  allMetrics.forEach(metric => {
    if (!chartData.find(item => item.metric === metric)) {
      chartData.push({ metric, data: [] });
    }
  });

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

  // Show onboarding UI for new users
  if (isNewUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to LiverTracker!</h1>
            <p className="text-xl text-gray-600 mb-8">
              Let's get you started with your health intelligence dashboard
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Your First Report</h2>
                <p className="text-gray-600 mb-6">
                  Upload a lab report to start tracking your health metrics and get AI-powered insights.
                </p>
              </div>
              <Link
                href="/upload-enhanced"
                className="block w-full bg-green-600 text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Upload Report
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Complete Your Profile</h2>
                <p className="text-gray-600 mb-6">
                  Set up your profile for personalized health insights and accurate calculations.
                </p>
              </div>
              <Link
                href="/profile"
                className="block w-full bg-blue-600 text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Set Up Profile
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What you can do with LiverTracker:</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mb-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Track Trends</h4>
                <p className="text-sm text-gray-600">Monitor your health metrics over time</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-full mb-3">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">AI Insights</h4>
                <p className="text-sm text-gray-600">Get intelligent health recommendations</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Medical Scoring</h4>
                <p className="text-sm text-gray-600">Calculate MELD, Child-Pugh scores</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show normal dashboard for users with data
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simplified World-Class Dashboard */}
      <WorldClassDashboard charts={charts} />

      {/* Simplified sections for faster loading */}
      <div className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            📊 Your Health Analytics Dashboard
          </h2>
          <p className="text-gray-500">
            {charts.some(c => c.data.length > 0) 
              ? "Analyzing your health data and trends"
              : "Upload reports to see personalized health insights and trends"
            }
          </p>
        </div>
      </div>

      {/* Interactive Chart Analysis */}
      <div className="bg-white border-t border-gray-200" data-section="trends">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              📈 Health Metrics Overview
            </h2>
            <p className="text-base text-gray-600">
              {charts.some(c => c.data.length > 0)
                ? "Click any metric card for detailed analysis and trends"
                : "Your health metrics will appear here once you upload medical reports"
              }
            </p>
          </div>
          <CardGridDashboard charts={charts} />
        </div>
      </div>
    </div>
  );
}
