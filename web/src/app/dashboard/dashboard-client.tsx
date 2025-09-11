"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { canonicalizeMetricName, metricColors, referenceRanges, type CanonicalMetric } from "@/lib/metrics";
import type { SeriesPoint } from "@/components/trend-chart";
import { WorldClassDashboard } from "@/components/world-class/world-class-dashboard";
import CardGridDashboard from "@/components/card-grid-dashboard";
import { useOnboarding } from '@/hooks/use-onboarding';
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
  const router = useRouter();
  const { state: onboardingState, loading: onboardingLoading } = useOnboarding();
  const [charts, setCharts] = useState<ChartSpec[]>([]);
  const [reportCount, setReportCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check onboarding status and redirect if needed
  useEffect(() => {
    if (status === 'loading' || onboardingLoading) return;
    
    if (status === 'unauthenticated') {
      setLoading(false);
      return;
    }

    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    // If user needs onboarding, redirect to onboarding page
    if (onboardingState?.needsOnboarding) {
      console.log('🚀 Redirecting to onboarding for new user');
      router.push('/onboarding');
      return;
    }

    // If onboarding is complete, load dashboard data
    if (onboardingState && !onboardingState.needsOnboarding) {
      loadDashboardData();
    }
  }, [status, onboardingState, onboardingLoading, session?.user?.id, router]);

  // Load dashboard data when session is available
  async function loadDashboardData() {
    if (!session?.user?.id) return;

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

  // Show loading state
  if (loading || status === 'loading' || onboardingLoading) {
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

  // If onboarding is needed, the useEffect will redirect
  // This component should only render for users who have completed onboarding

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