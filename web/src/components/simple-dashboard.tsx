/**
 * Simple, reliable dashboard that works for all users
 */

'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SimpleReport {
  id: string;
  objectKey: string;
  createdAt: string;
  reportType: string;
}

export function SimpleDashboard() {
  const { data: session, status } = useSession();
  const [reports, setReports] = useState<SimpleReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchReports();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports', {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        setError('Failed to load reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to LiverTracker</h1>
          <p className="text-gray-600 mb-6">
            Track Your Liver. Extend Your Life. Advanced liver health monitoring and analysis platform.
          </p>
          <Link 
            href="/auth/signin"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name || session?.user?.email}
          </h1>
          <p className="text-gray-600">
            Here's your health dashboard overview
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Reports</h3>
            <p className="text-2xl font-bold text-blue-600">{reports.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
            <p className="text-2xl font-bold text-green-600">
              {reports.length > 0 ? 'Active' : 'Getting Started'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Last Upload</h3>
            <p className="text-sm text-gray-600">
              {reports.length > 0 
                ? new Date(reports[0].createdAt).toLocaleDateString()
                : 'No uploads yet'
              }
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Quick Action</h3>
            <Link 
              href="/reports"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All Reports →
            </Link>
          </div>
        </div>

        {/* Reports Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
              <Link 
                href="/reports"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <button 
                  onClick={fetchReports}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-600 mb-4">
                  Your account currently has no medical reports uploaded.
                </p>
                
                {/* Debug info for development */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                  <h4 className="font-medium text-yellow-800 mb-2">🔍 Debug Information</h4>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p>• User authenticated: ✅ {session?.user?.email}</p>
                    <p>• Database connected: ✅ API responding</p>
                    <p>• Reports found: ❌ 0 reports in database</p>
                    <p>• Status: Database appears to be empty</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Link 
                    href="/upload"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                  >
                    Upload Your First Report
                  </Link>
                  <div className="text-sm text-gray-500">
                    Supported formats: PDF, JPG, PNG
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.slice(0, 5).map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {report.reportType || 'Medical Report'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Uploaded {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link 
                      href={`/reports/${report.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Report →
                    </Link>
                  </div>
                ))}
                
                {reports.length > 5 && (
                  <div className="text-center pt-4">
                    <Link 
                      href="/reports"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View {reports.length - 5} more reports →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/reports" 
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-center group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📊</div>
            <div className="font-medium text-gray-900">Reports</div>
            <div className="text-sm text-gray-500 mt-1">View & analyze</div>
          </Link>
          
          <Link 
            href="/dashboard" 
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-center group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📈</div>
            <div className="font-medium text-gray-900">Analytics</div>
            <div className="text-sm text-gray-500 mt-1">Trends & insights</div>
          </Link>
          
          <Link 
            href="/profile" 
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-center group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">👤</div>
            <div className="font-medium text-gray-900">Profile</div>
            <div className="text-sm text-gray-500 mt-1">Personal info</div>
          </Link>
          
          <Link 
            href="/upload" 
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow text-center group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">⬆️</div>
            <div className="font-medium text-gray-900">Upload</div>
            <div className="text-sm text-gray-500 mt-1">Add new report</div>
          </Link>
        </div>
      </div>
    </div>
  );
}