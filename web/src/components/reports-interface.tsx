'use client';

import { useState, useMemo } from 'react';
import Link from "next/link";
import { DeleteReportButton } from "./delete-report-button";
import { QuickShareButton, ShareWithDoctorButton } from "./medical-sharing/share-report-button";

interface Report {
  id: string;
  reportType: string | null;
  reportDate: Date | null;
  createdAt: Date;
  objectKey: string | null;
  contentType: string | null;
  _count: { metrics: number };
}

interface Visit {
  startDate: Date;
  endDate: Date;
  reports: Report[];
  visitType?: string;
}

interface ReportsInterfaceProps {
  reports: Report[];
}

// Empty state component for when no reports exist
function EmptyReportsState() {
  return (
    <div className="text-center py-16 px-4">
      <div className="max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-4">No Reports Yet</h3>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Upload your first lab report to start tracking your health metrics and unlock powerful insights about your wellness journey.
        </p>

        <div className="bg-blue-50 rounded-xl p-6 mb-8">
          <h4 className="font-semibold text-blue-900 mb-3">What you can upload:</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center text-blue-700">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Lab reports (PDF)
            </div>
            <div className="flex items-center text-blue-700">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Blood work panels
            </div>
            <div className="flex items-center text-blue-700">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Imaging reports
            </div>
            <div className="flex items-center text-blue-700">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Clinical notes
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/upload-enhanced"
            className="inline-flex items-center justify-center w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Your First Report
          </Link>
          
          <Link
            href="/manual-entry"
            className="inline-flex items-center justify-center w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Enter Data Manually
          </Link>
        </div>

        <div className="mt-8 text-xs text-gray-500">
          💡 Tip: For best results, upload clear, high-quality images or PDFs
        </div>
      </div>
    </div>
  );
}

export function ReportsInterface({ reports }: ReportsInterfaceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const VISITS_PER_PAGE = 50;

  const getReportCategory = (reportType: string | null) => {
    if (!reportType) return { 
      type: 'Other', 
      icon: '📋', 
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50', 
      borderColor: 'border-amber-200', 
      textColor: 'text-amber-700',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
    };
    
    const type = reportType.toLowerCase();
    if (type.includes('lab') || type.includes('blood') || type.includes('metabolic') || type.includes('chemistry')) {
      return { 
        type: 'Laboratory', 
        icon: '🧪', 
        bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50', 
        borderColor: 'border-blue-200', 
        textColor: 'text-blue-700',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    }
    if (type.includes('ct') || type.includes('mri') || type.includes('ultrasound') || type.includes('x-ray') || type.includes('scan')) {
      return { 
        type: 'Imaging', 
        icon: '🏥', 
        bgColor: 'bg-gradient-to-br from-purple-50 to-violet-50', 
        borderColor: 'border-purple-200', 
        textColor: 'text-purple-700',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
      };
    }
    if (type.includes('clinical') || type.includes('consultation') || type.includes('visit') || type.includes('note')) {
      return { 
        type: 'Clinical', 
        icon: '👩‍⚕️', 
        bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50', 
        borderColor: 'border-emerald-200', 
        textColor: 'text-emerald-700',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
      };
    }
    return { 
      type: 'Other', 
      icon: '📋', 
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50', 
      borderColor: 'border-amber-200', 
      textColor: 'text-amber-700',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
    };
  };

  // Smart visit grouping: Group reports within 2-3 days of each other
  const groupReportsIntoVisits = (reports: Report[]): Visit[] => {
    if (reports.length === 0) return [];

    // Reports are already sorted by the backend, use them as-is
    const sortedReports = reports;

    const visits: Visit[] = [];
    let currentVisit: Report[] = [];
    let visitStartDate: Date | null = null;

    sortedReports.forEach((report) => {
      const reportDate = report.reportDate || report.createdAt;
      
      if (!visitStartDate) {
        // Start first visit
        visitStartDate = reportDate;
        currentVisit = [report];
      } else {
        // Check if this report belongs to current visit (within 3 days)
        const daysDiff = Math.abs(new Date(visitStartDate).getTime() - new Date(reportDate).getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff <= 3) {
          // Add to current visit
          currentVisit.push(report);
        } else {
          // Start new visit
          if (currentVisit.length > 0) {
            const visitReports = [...currentVisit];
            const dates = visitReports.map(r => r.reportDate || r.createdAt);
            const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
            const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
            
            visits.push({
              startDate: minDate,
              endDate: maxDate,
              reports: visitReports,
              visitType: determineVisitType(visitReports)
            });
          }
          
          visitStartDate = reportDate;
          currentVisit = [report];
        }
      }
    });

    // Add the last visit
    if (currentVisit.length > 0) {
      const visitReports = [...currentVisit];
      const dates = visitReports.map(r => r.reportDate || r.createdAt);
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      
      visits.push({
        startDate: minDate,
        endDate: maxDate,
        reports: visitReports,
        visitType: determineVisitType(visitReports)
      });
    }

    return visits;
  };

  const determineVisitType = (reports: Report[]): string => {
    const hasLab = reports.some(r => getReportCategory(r.reportType).type === 'Laboratory');
    const hasImaging = reports.some(r => getReportCategory(r.reportType).type === 'Imaging');
    const hasClinical = reports.some(r => getReportCategory(r.reportType).type === 'Clinical');
    
    if (hasLab && hasImaging && hasClinical) return 'Comprehensive Checkup';
    if (hasLab && hasImaging) return 'Diagnostic Workup';
    if (hasLab && hasClinical) return 'Clinical Follow-up';
    if (hasLab) return 'Laboratory Monitoring';
    if (hasImaging) return 'Imaging Study';
    if (hasClinical) return 'Clinical Visit';
    return 'Medical Visit';
  };

  const filteredReports = useMemo(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.reportType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.objectKey?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter(report => {
        const category = getReportCategory(report.reportType);
        return category.type.toLowerCase() === selectedType.toLowerCase();
      });
    }

    if (selectedPeriod) {
      const now = new Date();
      const filterDate = new Date();
      
      switch (selectedPeriod) {
        case '3m':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case '6m':
          filterDate.setMonth(now.getMonth() - 6);
          break;
        case '1y':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          return filtered;
      }
      
      filtered = filtered.filter(report => {
        const reportDate = report.reportDate || report.createdAt;
        return new Date(reportDate) >= filterDate;
      });
    }

    return filtered;
  }, [reports, searchTerm, selectedType, selectedPeriod]);

  const visits = useMemo(() => groupReportsIntoVisits(filteredReports), [filteredReports]);
  
  const paginatedVisits = useMemo(() => {
    const startIndex = (currentPage - 1) * VISITS_PER_PAGE;
    const endIndex = startIndex + VISITS_PER_PAGE;
    return visits.slice(startIndex, endIndex);
  }, [visits, currentPage]);

  const totalPages = Math.ceil(visits.length / VISITS_PER_PAGE);

  // Show empty state if no reports (after all hooks are declared)
  if (reports.length === 0) {
    return <EmptyReportsState />;
  }

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const longMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const isSameDay = start.getDate() === end.getDate() && start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    const isSameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    
    if (isSameDay) {
      return `${longMonths[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
    } else if (isSameMonth) {
      return `${longMonths[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
    }
  };

  const formatReportDate = (date: Date) => {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Always show year for clarity, especially for older reports
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const getStatusIndicator = (report: Report) => {
    const daysSinceUpload = Math.floor((Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceUpload <= 7) return { 
      status: 'New', 
      color: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300',
      icon: '✨'
    };
    if (report._count.metrics > 0) return { 
      status: 'Processed', 
      color: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300',
      icon: '✅'
    };
    return { 
      status: 'Archived', 
      color: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-300',
      icon: '📁'
    };
  };

  const uniqueTypes = [...new Set(reports.map(r => getReportCategory(r.reportType).type))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Beautiful Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl text-white">📋</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                    Medical Records
                  </h1>
                  <p className="text-lg text-gray-600 mt-1">
                    Your complete healthcare journey, beautifully organized
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Link 
                href="/consolidated-lab-report" 
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <span className="mr-2">📊</span>
                <span>Lab Analytics</span>
              </Link>
              <Link 
                href="/share-management" 
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <span className="mr-2">🔗</span>
                <span>Manage Shares</span>
              </Link>
              {reports.length > 0 && (
                <ShareWithDoctorButton 
                  reportIds={reports.map(r => r.id)}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                />
              )}
              <Link 
                href="/" 
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="mr-2">📄</span>
                <span>Upload Report</span>
              </Link>
            </div>
          </div>

          {/* Beautiful Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-xl text-white">📅</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{visits.length}</div>
                  <div className="text-sm text-gray-500">Total Visits</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full inline-block">
                {reports.length} reports total
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-xl text-white">🕐</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {visits.filter(v => {
                      const daysSince = (Date.now() - v.endDate.getTime()) / (1000 * 60 * 60 * 24);
                      return daysSince <= 30;
                    }).length}
                  </div>
                  <div className="text-sm text-gray-500">Recent Activity</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full inline-block">
                Last 30 days
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                  <span className="text-xl text-white">🧪</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {reports.reduce((sum, r) => sum + r._count.metrics, 0)}
                  </div>
                  <div className="text-sm text-gray-500">Lab Data Points</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full inline-block">
                Extracted values
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <span className="text-xl text-white">⏳</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {reports.filter(r => r._count.metrics === 0).length}
                  </div>
                  <div className="text-sm text-gray-500">Processing Queue</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full inline-block">
                Pending analysis
              </div>
            </div>
          </div>
        </div>

        {/* Modern Search & Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-lg">🔍</span>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search medical records by type, keywords, or file name..."
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-gray-50 focus:bg-white transition-all duration-200"
                suppressHydrationWarning
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-3">
                <label className="text-sm font-semibold text-gray-700">Category:</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 hover:bg-white transition-all duration-200"
                  suppressHydrationWarning
                >
                  <option value="">All Categories</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <label className="text-sm font-semibold text-gray-700">Timeframe:</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 hover:bg-white transition-all duration-200"
                  suppressHydrationWarning
                >
                  <option value="">All Time</option>
                  <option value="3m">Last 3 Months</option>
                  <option value="6m">Last 6 Months</option>
                  <option value="1y">Last Year</option>
                </select>
              </div>

              {/* Active Filters */}
              {(searchTerm || selectedType || selectedPeriod) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Active filters:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                      🔍 Search: {searchTerm}
                      <button onClick={() => setSearchTerm('')} className="ml-2 text-blue-600 hover:text-blue-800 font-bold">×</button>
                    </span>
                  )}
                  {selectedType && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200">
                      📂 Category: {selectedType}
                      <button onClick={() => setSelectedType('')} className="ml-2 text-purple-600 hover:text-purple-800 font-bold">×</button>
                    </span>
                  )}
                  {selectedPeriod && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200">
                      📅 Time: {selectedPeriod === '3m' ? 'Last 3 Months' : selectedPeriod === '6m' ? 'Last 6 Months' : 'Last Year'}
                      <button onClick={() => setSelectedPeriod('')} className="ml-2 text-emerald-600 hover:text-emerald-800 font-bold">×</button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600 font-medium">
                {visits.length === 0 
                  ? 'No visits found'
                  : `Showing ${paginatedVisits.length} of ${visits.length} visits (${filteredReports.length} reports)`
                }
              </div>
              {totalPages > 1 && (
                <div className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Page {currentPage} of {totalPages}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Beautiful Visit-Based Medical Records */}
        {paginatedVisits.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">{searchTerm || selectedType || selectedPeriod ? '🔍' : '🏥'}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm || selectedType || selectedPeriod ? 'No matching reports found' : 'No medical visits found'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || selectedType || selectedPeriod 
                ? "Try adjusting your search criteria or filters to find what you're looking for. You can also clear all filters to see all reports."
                : "Upload your first medical report to begin tracking your healthcare journey and unlock powerful health insights."
              }
            </p>
            
            {searchTerm || selectedType || selectedPeriod ? (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedType('');
                    setSelectedPeriod('');
                  }}
                  className="inline-flex items-center px-6 py-3 bg-gray-600 text-white font-medium rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Clear All Filters
                </button>
                <div className="text-sm text-gray-500">
                  or <Link href="/upload-enhanced" className="text-blue-600 hover:text-blue-700 font-medium">upload a new report</Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Link href="/upload-enhanced" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Your First Report
                </Link>
                <div className="text-sm text-gray-500">
                  or <Link href="/manual-entry" className="text-blue-600 hover:text-blue-700 font-medium">enter data manually</Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {paginatedVisits.map((visit, visitIndex) => (
              <div key={visitIndex} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Beautiful Visit Header */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl text-white">📅</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {formatDateRange(visit.startDate, visit.endDate)}
                        </h2>
                        <p className="text-gray-600 mt-1">
                          {visit.visitType} • {visit.reports.length} {visit.reports.length === 1 ? 'report' : 'reports'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Beautiful Visit Summary Badges */}
                      {[...new Set(visit.reports.map(r => getReportCategory(r.reportType).type))].map(type => {
                        const category = getReportCategory(visit.reports.find(r => getReportCategory(r.reportType).type === type)?.reportType || null);
                        const count = visit.reports.filter(r => getReportCategory(r.reportType).type === type).length;
                        return (
                          <span key={type} className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium border ${category.badgeColor} shadow-sm`}>
                            <span className="mr-2">{category.icon}</span>
                            <span>{count} {type}</span>
                          </span>
                        );
                      })}
                      
                      {/* Visit-Level Share Button */}
                      <ShareWithDoctorButton 
                        reportIds={visit.reports.map(r => r.id)}
                        className="ml-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Beautiful Reports in Visit */}
                <div className="p-6 space-y-4">
                  {visit.reports.map((report) => {
                    const category = getReportCategory(report.reportType);
                    const status = getStatusIndicator(report);
                    const reportDate = report.reportDate || report.createdAt;

                    return (
                      <div key={report.id} className="group relative bg-white hover:bg-gray-50 rounded-lg p-3 sm:p-4 transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm">
                        {/* Desktop Layout - Horizontal */}
                        <div className="hidden sm:flex items-center justify-between">
                          {/* Left Section - Report Info */}
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${category.bgColor}`}>
                              <span className="text-lg">{category.icon}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-1">
                                <h3 className="text-base font-semibold text-gray-900 truncate">
                                  {report.reportType || 'Medical Report'}
                                </h3>
                                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                                  <span className="mr-1">{status.icon}</span>
                                  {status.status}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="flex items-center">
                                  📅 {formatReportDate(reportDate)}
                                </span>
                                <span className="flex items-center">
                                  📁 <span className="ml-1 truncate max-w-[150px]">{report.objectKey?.split('/').pop() || 'Unknown file'}</span>
                                </span>
                                {report._count.metrics > 0 && (
                                  <span className="flex items-center text-green-600">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                    {report._count.metrics} values
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Right Section - Action Buttons */}
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <Link
                              href={`/reports/${report.id}`}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                            >
                              <span className="mr-1">👁️</span>
                              View & Preview
                            </Link>
                            <QuickShareButton 
                              reportId={report.id}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                            />
                            <button 
                              onClick={async () => {
                                if (!report.objectKey) {
                                  alert('No file available for download');
                                  return;
                                }
                                try {
                                  const response = await fetch(`/api/storage/sign-download?key=${encodeURIComponent(report.objectKey)}`);
                                  if (!response.ok) {
                                    const errorData = await response.json().catch(() => ({}));
                                    if (response.status === 404) {
                                      alert('File not found. This file may have been deleted or moved.');
                                    } else {
                                      alert(`Download failed: ${errorData.message || 'Unknown error'}`);
                                    }
                                    return;
                                  }
                                  const { url } = await response.json();
                                  window.open(url, '_blank');
                                } catch (error) {
                                  console.error('Download failed:', error);
                                  alert('Failed to download file. Please check your connection and try again.');
                                }
                              }}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              <span className="mr-1">📥</span>
                              Download
                            </button>
                            <DeleteReportButton reportId={report.id} variant="compact" />
                          </div>
                        </div>

                        {/* Mobile Layout - Stacked */}
                        <div className="sm:hidden space-y-3">
                          {/* Header */}
                          <div className="flex items-start space-x-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${category.bgColor}`}>
                              <span className="text-sm">{category.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {report.reportType || 'Medical Report'}
                              </h3>
                              <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${status.color} mt-1`}>
                                <span className="mr-1">{status.icon}</span>
                                {status.status}
                              </div>
                            </div>
                          </div>
                          
                          {/* Info */}
                          <div className="space-y-1 text-xs text-gray-600 pl-11">
                            <div>📅 {formatReportDate(reportDate)}</div>
                            <div>📁 {report.objectKey?.split('/').pop() || 'Unknown file'}</div>
                            {report._count.metrics > 0 && (
                              <div className="text-green-600">
                                ● {report._count.metrics} values extracted
                              </div>
                            )}
                          </div>
                          
                          {/* Buttons */}
                          <div className="flex items-center space-x-2 pl-11">
                            <Link
                              href={`/reports/${report.id}`}
                              className="inline-flex items-center px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                            >
                              <span className="mr-1">👁️</span>
                              Preview
                            </Link>
                            <QuickShareButton 
                              reportId={report.id}
                              className="inline-flex items-center px-3 py-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                            />
                            <button 
                              onClick={async () => {
                                if (!report.objectKey) {
                                  alert('No file available for download');
                                  return;
                                }
                                try {
                                  const response = await fetch(`/api/storage/sign-download?key=${encodeURIComponent(report.objectKey)}`);
                                  if (!response.ok) {
                                    const errorData = await response.json().catch(() => ({}));
                                    if (response.status === 404) {
                                      alert('File not found. This file may have been deleted or moved.');
                                    } else {
                                      alert(`Download failed: ${errorData.message || 'Unknown error'}`);
                                    }
                                    return;
                                  }
                                  const { url } = await response.json();
                                  window.open(url, '_blank');
                                } catch (error) {
                                  console.error('Download failed:', error);
                                  alert('Failed to download file. Please check your connection and try again.');
                                }
                              }}
                              className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              <span className="mr-1">📥</span>
                              DL
                            </button>
                            <DeleteReportButton reportId={report.id} variant="compact" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Beautiful Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-600 font-medium">
                Showing {((currentPage - 1) * VISITS_PER_PAGE) + 1} to {Math.min(currentPage * VISITS_PER_PAGE, visits.length)} of {visits.length} visits
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                >
                  ← Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2 text-gray-400">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                          currentPage === totalPages
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
