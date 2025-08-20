'use client';

import { useState, useMemo } from 'react';
import Link from "next/link";

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

export function ReportsInterface({ reports }: ReportsInterfaceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const VISITS_PER_PAGE = 50;

  const getReportCategory = (reportType: string | null) => {
    if (!reportType) return { type: 'Other', color: 'amber', icon: '📋', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700' };
    
    const type = reportType.toLowerCase();
    if (type.includes('lab') || type.includes('blood') || type.includes('metabolic') || type.includes('chemistry')) {
      return { type: 'Laboratory', color: 'blue', icon: '🧪', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' };
    }
    if (type.includes('ct') || type.includes('mri') || type.includes('ultrasound') || type.includes('x-ray') || type.includes('scan')) {
      return { type: 'Imaging', color: 'purple', icon: '🏥', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', textColor: 'text-purple-700' };
    }
    if (type.includes('clinical') || type.includes('consultation') || type.includes('visit') || type.includes('note')) {
      return { type: 'Clinical', color: 'green', icon: '👩‍⚕️', bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700' };
    }
    return { type: 'Other', color: 'amber', icon: '📋', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700' };
  };

  // Smart visit grouping: Group reports within 2-3 days of each other
  const groupReportsIntoVisits = (reports: Report[]): Visit[] => {
    if (reports.length === 0) return [];

    // Sort reports by date (report date first, then created date)
    const sortedReports = [...reports].sort((a, b) => {
      const dateA = a.reportDate || a.createdAt;
      const dateB = b.reportDate || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

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

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const isSameDay = start.toDateString() === end.toDateString();
    const isSameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    
    if (isSameDay) {
      return start.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } else if (isSameMonth) {
      return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}-${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  };

  const formatReportDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getStatusIndicator = (report: Report) => {
    const daysSinceUpload = Math.floor((new Date().getTime() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceUpload <= 7) return { status: 'New', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (report._count.metrics > 0) return { status: 'Processed', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    return { status: 'Archived', color: 'bg-gray-50 text-gray-600 border-gray-200' };
  };

  const uniqueTypes = [...new Set(reports.map(r => getReportCategory(r.reportType).type))];

  return (
    <div className="min-h-screen bg-medical-neutral-50">
      <div className="medical-layout-container py-8">
        {/* Medical Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-medical-neutral-900 mb-2">
                Medical Records
              </h1>
              <p className="text-lg text-medical-neutral-600">
                Visit-based chronological view of your healthcare journey
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center space-x-3">
              <Link 
                href="/consolidated-lab-report" 
                className="btn-secondary flex items-center space-x-2"
              >
                <span>📊</span>
                <span>Consolidated Lab Report</span>
              </Link>
              <Link 
                href="/" 
                className="btn-primary flex items-center space-x-2"
              >
                <span>📄</span>
                <span>Upload Report</span>
              </Link>
            </div>
          </div>

          {/* Clinical Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="medical-card-metric">
              <div className="flex items-center justify-between mb-2">
                <div className="metric-label">Total Visits</div>
                <span className="text-2xl">📅</span>
              </div>
              <div className="metric-value text-medical-primary-600">{visits.length}</div>
              <div className="text-xs text-medical-neutral-500 mt-1">{reports.length} reports</div>
            </div>
            
            <div className="medical-card-metric">
              <div className="flex items-center justify-between mb-2">
                <div className="metric-label">Recent Activity</div>
                <span className="text-2xl">🕐</span>
              </div>
              <div className="metric-value text-emerald-600">
                {visits.filter(v => {
                  const daysSince = (new Date().getTime() - v.endDate.getTime()) / (1000 * 60 * 60 * 24);
                  return daysSince <= 30;
                }).length}
              </div>
              <div className="text-xs text-medical-neutral-500 mt-1">Last 30 days</div>
            </div>
            
            <div className="medical-card-metric">
              <div className="flex items-center justify-between mb-2">
                <div className="metric-label">Lab Data Points</div>
                <span className="text-2xl">🧪</span>
              </div>
              <div className="metric-value text-blue-600">
                {reports.reduce((sum, r) => sum + r._count.metrics, 0)}
              </div>
              <div className="text-xs text-medical-neutral-500 mt-1">Extracted values</div>
            </div>
            
            <div className="medical-card-metric">
              <div className="flex items-center justify-between mb-2">
                <div className="metric-label">Processing Queue</div>
                <span className="text-2xl">⏳</span>
              </div>
              <div className="metric-value text-amber-600">
                {reports.filter(r => r._count.metrics === 0).length}
              </div>
              <div className="text-xs text-medical-neutral-500 mt-1">Pending analysis</div>
            </div>
          </div>
        </div>

        {/* Clinical Search & Filters */}
        <div className="medical-card-primary mb-8">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-medical-neutral-400">🔍</span>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search medical records by type, keywords, or file name..."
                className="w-full pl-10 pr-4 py-3 border border-medical-neutral-300 rounded-lg focus:ring-2 focus:ring-medical-primary-500 focus:border-transparent text-medical-neutral-900 placeholder-medical-neutral-500"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-medical-neutral-700">Category:</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-medical-neutral-300 rounded-lg focus:ring-2 focus:ring-medical-primary-500 text-sm"
                >
                  <option value="">All Categories</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-medical-neutral-700">Timeframe:</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border border-medical-neutral-300 rounded-lg focus:ring-2 focus:ring-medical-primary-500 text-sm"
                >
                  <option value="">All Time</option>
                  <option value="3m">Last 3 Months</option>
                  <option value="6m">Last 6 Months</option>
                  <option value="1y">Last Year</option>
                </select>
              </div>

              {/* Active Filters */}
              {(searchTerm || selectedType || selectedPeriod) && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-medical-neutral-500">Active filters:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-medical-primary-100 text-medical-primary-700">
                      Search: {searchTerm}
                      <button onClick={() => setSearchTerm('')} className="ml-1 text-medical-primary-500 hover:text-medical-primary-700">×</button>
                    </span>
                  )}
                  {selectedType && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Category: {selectedType}
                      <button onClick={() => setSelectedType('')} className="ml-1 text-blue-500 hover:text-blue-700">×</button>
                    </span>
                  )}
                  {selectedPeriod && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      Time: {selectedPeriod === '3m' ? 'Last 3 Months' : selectedPeriod === '6m' ? 'Last 6 Months' : 'Last Year'}
                      <button onClick={() => setSelectedPeriod('')} className="ml-1 text-purple-500 hover:text-purple-700">×</button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-medical-neutral-600">
              <div>
                {visits.length === 0 
                  ? 'No visits found'
                  : `Showing ${paginatedVisits.length} of ${visits.length} visits (${filteredReports.length} reports)`
                }
              </div>
              {totalPages > 1 && (
                <div className="text-medical-neutral-500">
                  Page {currentPage} of {totalPages}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Visit-Based Medical Records */}
        {paginatedVisits.length === 0 ? (
          <div className="medical-card-primary text-center py-12">
            <div className="w-16 h-16 bg-medical-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏥</span>
            </div>
            <h3 className="text-lg font-medium text-medical-neutral-900 mb-2">
              No medical visits found
            </h3>
            <p className="text-medical-neutral-600 mb-6">
              {searchTerm || selectedType || selectedPeriod 
                ? "Try adjusting your search criteria or filters"
                : "Upload your first medical report to begin tracking your healthcare journey"
              }
            </p>
            {!searchTerm && !selectedType && !selectedPeriod && (
              <Link href="/" className="btn-primary">
                <span className="mr-2">📄</span>
                Upload Your First Report
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {paginatedVisits.map((visit, visitIndex) => (
              <div key={visitIndex} className="medical-card-primary">
                {/* Visit Header */}
                <div className="border-b border-medical-neutral-200 pb-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-medical-primary-100 rounded-xl flex items-center justify-center">
                          <span className="text-xl">📅</span>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-medical-neutral-900">
                            {formatDateRange(visit.startDate, visit.endDate)}
                          </h2>
                          <p className="text-sm text-medical-neutral-600">
                            {visit.visitType} • {visit.reports.length} {visit.reports.length === 1 ? 'report' : 'reports'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* Visit Summary Badges */}
                      <div className="flex items-center space-x-2">
                        {[...new Set(visit.reports.map(r => getReportCategory(r.reportType).type))].map(type => {
                          const category = getReportCategory(visit.reports.find(r => getReportCategory(r.reportType).type === type)?.reportType || null);
                          const count = visit.reports.filter(r => getReportCategory(r.reportType).type === type).length;
                          return (
                            <span key={type} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${category.bgColor} ${category.borderColor} ${category.textColor}`}>
                              {category.icon} {count} {type}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reports in Visit */}
                <div className="space-y-3">
                  {visit.reports.map((report) => {
                    const category = getReportCategory(report.reportType);
                    const status = getStatusIndicator(report);
                    const reportDate = report.reportDate || report.createdAt;

                    return (
                      <div key={report.id} className={`group relative border-l-4 ${category.borderColor} pl-4 py-3 hover:bg-medical-neutral-25 transition-colors rounded-r-lg`}>
                        <div className="flex items-center justify-between">
                          {/* Report Info */}
                          <div className="flex items-center space-x-4 flex-1">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${category.bgColor}`}>
                              <span className="text-lg">{category.icon}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="text-base font-medium text-medical-neutral-900 group-hover:text-medical-primary-600 transition-colors">
                                  {report.reportType || 'Medical Report'}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-medical-neutral-500">
                                    {formatReportDate(reportDate)}
                                  </span>
                                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                                    {status.status}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm text-medical-neutral-600">
                                  <span className="truncate max-w-xs">
                                    📁 {report.objectKey?.split('/').pop() || 'Unknown file'}
                                  </span>
                                  {report._count.metrics > 0 && (
                                    <span className="inline-flex items-center">
                                      <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                                      {report._count.metrics} values
                                    </span>
                                  )}
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center space-x-2">
                                  <Link
                                    href={`/reports/${report.id}`}
                                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-medical-primary-600 hover:text-medical-primary-700 hover:bg-medical-primary-50 rounded-md transition-colors"
                                  >
                                    <span className="mr-1">👁️</span>
                                    View
                                  </Link>
                                  <button className="inline-flex items-center px-3 py-1 text-sm font-medium text-medical-neutral-600 hover:text-medical-neutral-700 hover:bg-medical-neutral-50 rounded-md transition-colors">
                                    <span className="mr-1">📄</span>
                                    PDF
                                  </button>
                                  <button className="inline-flex items-center px-3 py-1 text-sm font-medium text-medical-neutral-600 hover:text-medical-neutral-700 hover:bg-medical-neutral-50 rounded-md transition-colors">
                                    <span className="mr-1">📥</span>
                                    Download
                                  </button>
                                </div>
                              </div>
                            </div>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-medical-neutral-500">
              Showing {((currentPage - 1) * VISITS_PER_PAGE) + 1} to {Math.min(currentPage * VISITS_PER_PAGE, visits.length)} of {visits.length} visits
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-2 text-sm font-medium text-medical-neutral-600 hover:text-medical-neutral-700 hover:bg-medical-neutral-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        currentPage === pageNum
                          ? 'bg-medical-primary-600 text-white'
                          : 'text-medical-neutral-600 hover:text-medical-neutral-700 hover:bg-medical-neutral-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-2 text-medical-neutral-400">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        currentPage === totalPages
                          ? 'bg-medical-primary-600 text-white'
                          : 'text-medical-neutral-600 hover:text-medical-neutral-700 hover:bg-medical-neutral-50'
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
                className="px-3 py-2 text-sm font-medium text-medical-neutral-600 hover:text-medical-neutral-700 hover:bg-medical-neutral-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}