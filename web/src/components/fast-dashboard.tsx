"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface FastReport {
  id: string;
  title: string;
  createdAt: string;
  reportType: string;
  status: string;
}

export default function FastDashboard() {
  const { data: session, status } = useSession();
  const [reports, setReports] = useState<FastReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchReports();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
    
    // Fallback timeout to prevent infinite loading
    const fallbackTimer = setTimeout(() => {
      console.warn('Dashboard loading timeout - forcing ready state');
      setLoading(false);
    }, 10000);
    
    return () => clearTimeout(fallbackTimer);
  }, [status]);

  const fetchReports = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('/api/fast/reports?limit=5', {
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        console.warn('Reports API returned:', response.status);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Reports API timed out');
      } else {
        console.error('Failed to fetch reports:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to LiverTracker</h1>
          <p className="text-gray-600 mb-6">Please sign in to access your medical dashboard</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">LiverTracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {session?.user?.name || session?.user?.email}
              </span>
              <Link 
                href="/api/auth/signout"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Reports</h3>
            <p className="text-3xl font-bold text-blue-600">{reports.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Activity</h3>
            <p className="text-3xl font-bold text-green-600">
              {reports.length > 0 ? 'Active' : 'No Data'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
            <Link 
              href="/reports"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              View All Reports
            </Link>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Reports</h2>
          </div>
          <div className="p-6">
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No reports found</p>
                <Link 
                  href="/upload"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload Your First Report
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div>
                      <h3 className="font-medium text-gray-900">{report.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()} • {report.reportType}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        report.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.status}
                      </span>
                      <Link 
                        href={`/reports/${report.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/reports" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium text-gray-900">Reports</div>
          </Link>
          <Link href="/dashboard" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="text-2xl mb-2">📈</div>
            <div className="font-medium text-gray-900">Analytics</div>
          </Link>
          <Link href="/profile" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="text-2xl mb-2">👤</div>
            <div className="font-medium text-gray-900">Profile</div>
          </Link>
          <Link href="/settings" className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="text-2xl mb-2">⚙️</div>
            <div className="font-medium text-gray-900">Settings</div>
          </Link>
        </div>
      </main>
    </div>
  );
}