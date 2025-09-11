"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { canonicalizeMetricName, metricColors, referenceRanges, type CanonicalMetric } from "@/lib/metrics";
import type { SeriesPoint } from "@/components/trend-chart";
import { WorldClassDashboard } from "@/components/world-class/world-class-dashboard";
import CardGridDashboard from "@/components/card-grid-dashboard";
import Link from "next/link";

interface ChartSpec {
  title: CanonicalMetric;
  color: string;
  data: SeriesPoint[];
  range: {
    low: number;
    high: number;
  };
  unit: string;
  platform: string;
}

export default function DashboardClient() {
  const { data: session, status } = useSession();
  const [charts, setCharts] = useState<ChartSpec[]>([]);
  const [reportCount, setReportCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data when session is available
  useEffect(() => {
    async function loadDashboardData() {
      if (status === 'loading') return;
      
      if (status === 'unauthenticated') {
        setLoading(false);
        return;
      }

      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        console.log('🏠 Loading dashboard data for user:', session.user.id);
        setLoading(true);
        setError(null);

        // Check report count
        const reportResponse = await fetch('/api/reports');
        if (!reportResponse.ok) {
          throw new Error('Failed to fetch reports');
        }
        const reports = await reportResponse.json();
        const count = reports.length || 0;
        setReportCount(count);

        // If no reports, show onboarding
        if (count === 0) {
          setCharts([]);
          setLoading(false);
          return;
        }

        // Load chart data for all metrics
        const allMetrics: CanonicalMetric[] = [
          'ALT', 'AST', 'Platelets', 'Bilirubin', 'Albumin', 'Creatinine', 
          'INR', 'ALP', 'GGT', 'TotalProtein', 'Sodium', 'Potassium'
        ];

        console.log(`📊 Loading ${allMetrics.length} metrics...`);

        // Load chart data for each metric
        const chartPromises = allMetrics.map(async (metric) => {
          try {
            const response = await fetch(`/api/chart-data?metric=${metric}`);
            if (!response.ok) {
              console.warn(`Failed to load ${metric}:`, response.status);
              return { metric, data: [] };
            }
            const data = await response.json();
            return { metric, data: data.data || [] };
          } catch (error) {
            console.warn(`Error loading ${metric}:`, error);
            return { metric, data: [] };
          }
        });

        const chartData = await Promise.all(chartPromises);

        // Create chart specifications
        const chartSpecs = chartData.map(({ metric, data }) => {
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
            platform: 'client_side_v1'
          };
        });

        setCharts(chartSpecs);
        console.log(`✅ Loaded data for ${chartSpecs.length} metrics`);

      } catch (error) {
        console.error('Dashboard loading error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard');
        setCharts([]);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [session, status]);

  // Show loading state
  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Preparing your health analytics...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show unauthenticated state
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to view your dashboard.</p>
          <Link 
            href="/auth/signin" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Show onboarding for new users
  if (reportCount === 0) {
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
      {/* World-Class Dashboard */}
      <WorldClassDashboard charts={charts} />

      {/* Dashboard sections */}
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