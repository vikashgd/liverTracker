'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Report {
  id: string;
  fileName: string;
  uploadDate: string;
  category: 'lab' | 'imaging' | 'clinical' | 'medication' | 'procedure';
  status: 'processed' | 'processing' | 'error';
  extractedData?: any;
  fileSize: number;
  fileType: string;
  thumbnailUrl?: string;
}

interface GroupedReports {
  [key: string]: Report[];
}

export function EnhancedReportsDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [groupBy, setGroupBy] = useState<'date' | 'category' | 'type'>('category');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showRawViewer, setShowRawViewer] = useState(false);

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockReports: Report[] = [
      {
        id: '1',
        fileName: 'Lab_Results_2024_Jan.pdf',
        uploadDate: '2024-01-15',
        category: 'lab',
        status: 'processed',
        fileSize: 1024000,
        fileType: 'application/pdf',
        extractedData: { metrics: ['ALT', 'AST', 'Bilirubin'] }
      },
      {
        id: '2',
        fileName: 'CT_Scan_Liver_2024.pdf',
        uploadDate: '2024-01-20',
        category: 'imaging',
        status: 'processed',
        fileSize: 5120000,
        fileType: 'application/pdf'
      },
      {
        id: '3',
        fileName: 'Doctor_Visit_Notes.pdf',
        uploadDate: '2024-01-25',
        category: 'clinical',
        status: 'processed',
        fileSize: 512000,
        fileType: 'application/pdf'
      }
    ];
    setReports(mockReports);
  }, []);

  const getCategoryConfig = (category: string) => {
    const configs = {
      lab: {
        color: 'bg-red-50 border-red-200',
        badge: 'bg-red-100 text-red-700',
        icon: '🧪',
        label: 'Lab Report'
      },
      imaging: {
        color: 'bg-blue-50 border-blue-200',
        badge: 'bg-blue-100 text-blue-700',
        icon: '🏥',
        label: 'Imaging'
      },
      clinical: {
        color: 'bg-green-50 border-green-200',
        badge: 'bg-green-100 text-green-700',
        icon: '👩‍⚕️',
        label: 'Clinical Notes'
      },
      medication: {
        color: 'bg-yellow-50 border-yellow-200',
        badge: 'bg-yellow-100 text-yellow-700',
        icon: '💊',
        label: 'Medication'
      },
      procedure: {
        color: 'bg-purple-50 border-purple-200',
        badge: 'bg-purple-100 text-purple-700',
        icon: '🏥',
        label: 'Procedure'
      }
    };
    return configs[category as keyof typeof configs] || configs.clinical;
  };

  const groupReports = (reports: Report[]): GroupedReports => {
    switch (groupBy) {
      case 'date':
        return reports.reduce((groups: GroupedReports, report) => {
          const date = new Date(report.uploadDate);
          const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          if (!groups[monthYear]) groups[monthYear] = [];
          groups[monthYear].push(report);
          return groups;
        }, {});
      
      case 'category':
        return reports.reduce((groups: GroupedReports, report) => {
          const config = getCategoryConfig(report.category);
          if (!groups[config.label]) groups[config.label] = [];
          groups[config.label].push(report);
          return groups;
        }, {});
      
      case 'type':
        return reports.reduce((groups: GroupedReports, report) => {
          const type = report.fileType === 'application/pdf' ? 'PDF Documents' : 'Other Files';
          if (!groups[type]) groups[type] = [];
          groups[type].push(report);
          return groups;
        }, {});
      
      default:
        return { 'All Reports': reports };
    }
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleViewRawReport = (report: Report) => {
    setSelectedReport(report);
    setShowRawViewer(true);
  };

  const handleDownloadReport = (report: Report) => {
    // Implement download functionality
    console.log('Downloading report:', report.fileName);
  };

  const groupedReports = groupReports(reports);

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Reports</h1>
          <p className="text-gray-600">Organize and access your medical documents</p>
        </div>
        
        <div className="flex flex-wrap items-center space-x-4">
          {/* Group By Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Group by:</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
            >
              <option value="category">Category</option>
              <option value="date">Date</option>
              <option value="type">File Type</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
            >
              📊
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
            >
              📝
            </button>
          </div>
        </div>
      </div>

      {/* Reports Grid/List */}
      <div className="space-y-8">
        {Object.entries(groupedReports).map(([groupName, groupReports]) => (
          <div key={groupName} className="space-y-4">
            {/* Group Header */}
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-gray-900">{groupName}</h2>
              <Badge className="bg-gray-100 text-gray-600">
                {groupReports.length} {groupReports.length === 1 ? 'report' : 'reports'}
              </Badge>
            </div>

            {/* Reports in Group */}
            <div className={`grid gap-4 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {groupReports.map((report) => {
                const config = getCategoryConfig(report.category);
                
                return (
                  <Card 
                    key={report.id} 
                    className={`${config.color} border-2 hover:shadow-lg transition-all duration-200 cursor-pointer`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{config.icon}</span>
                          <div>
                            <CardTitle className="text-sm font-medium text-gray-900 truncate">
                              {report.fileName}
                            </CardTitle>
                            <Badge className={`${config.badge} text-xs mt-1`}>
                              {config.label}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {report.status === 'processed' && (
                            <span className="text-green-500 text-sm">✅</span>
                          )}
                          {report.status === 'processing' && (
                            <span className="text-yellow-500 text-sm">⏳</span>
                          )}
                          {report.status === 'error' && (
                            <span className="text-red-500 text-sm">❌</span>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Report Info */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Date:</span>
                            <div>{formatDate(report.uploadDate)}</div>
                          </div>
                          <div>
                            <span className="font-medium">Size:</span>
                            <div>{formatFileSize(report.fileSize)}</div>
                          </div>
                        </div>

                        {/* Extracted Metrics Preview */}
                        {report.extractedData?.metrics && (
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-700">Extracted Metrics:</span>
                            <div className="flex flex-wrap gap-1">
                              {report.extractedData.metrics.slice(0, 3).map((metric: string) => (
                                <Badge key={metric} className="bg-white/50 text-gray-600 text-xs">
                                  {metric}
                                </Badge>
                              ))}
                              {report.extractedData.metrics.length > 3 && (
                                <Badge className="bg-white/50 text-gray-600 text-xs">
                                  +{report.extractedData.metrics.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewRawReport(report);
                            }}
                            className="flex-1 bg-white/80 hover:bg-white text-gray-700 text-xs py-2 px-3 rounded-lg border border-gray-200 transition-colors"
                          >
                            📄 View Original
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadReport(report);
                            }}
                            className="flex-1 bg-white/80 hover:bg-white text-gray-700 text-xs py-2 px-3 rounded-lg border border-gray-200 transition-colors"
                          >
                            📥 Download
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Raw Report Viewer Modal */}
      {showRawViewer && selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedReport.fileName}</h3>
                <p className="text-sm text-gray-600">Original Document Viewer</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadReport(selectedReport)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                >
                  📥 Download
                </button>
                <button
                  onClick={() => setShowRawViewer(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 p-4">
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-4xl">📄</div>
                  <div>
                    <h4 className="font-medium text-gray-900">PDF Viewer</h4>
                    <p className="text-sm text-gray-600">
                      Original document: {selectedReport.fileName}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      PDF viewer will be implemented here
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadReport(selectedReport)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download Original File
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload New Report Button */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-40">
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105">
          <span className="text-xl">📄+</span>
        </button>
      </div>
    </div>
  );
}
