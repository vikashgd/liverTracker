import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";

export default async function ReportsPage() {
  const userId = await requireAuth();
  
  const reports = await prisma.reportFile.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      reportType: true,
      reportDate: true,
      createdAt: true,
      objectKey: true,
      contentType: true,
      _count: {
        select: { metrics: true }
      }
    },
  });

  // Group by month for better organization
  const groups = reports.reduce<Record<string, typeof reports>>((acc, r) => {
    const date = r.reportDate ? new Date(r.reportDate) : r.createdAt;
    const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    (acc[monthKey] = acc[monthKey] || []).push(r);
    return acc;
  }, {});
  
  const monthKeys = Object.keys(groups).sort((a, b) => {
    const dateA = new Date(a + ' 1, 2020');
    const dateB = new Date(b + ' 1, 2020');
    return dateB.getTime() - dateA.getTime();
  });

  const getFileTypeIcon = (contentType: string) => {
    if (contentType?.includes('pdf')) return '📄';
    if (contentType?.includes('image')) return '🖼️';
    return '📋';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-medical-neutral-50">
      <div className="medical-layout-container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-medical-neutral-900 mb-2">
                Medical Reports Library
              </h1>
              <p className="text-medical-neutral-600">
                Access and manage your uploaded medical reports and lab results
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <Link 
                href="/timeline" 
                className="btn-secondary flex items-center space-x-2"
              >
                <span>📅</span>
                <span>Timeline View</span>
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
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="medical-card-metric">
            <div className="metric-label mb-2">Total Reports</div>
            <div className="metric-value text-medical-primary-600">
              {reports.length}
            </div>
          </div>
          <div className="medical-card-metric">
            <div className="metric-label mb-2">This Month</div>
            <div className="metric-value text-medical-success-600">
              {reports.filter(r => {
                const reportDate = r.reportDate ? new Date(r.reportDate) : r.createdAt;
                const thisMonth = new Date();
                return reportDate.getMonth() === thisMonth.getMonth() && 
                       reportDate.getFullYear() === thisMonth.getFullYear();
              }).length}
            </div>
          </div>
          <div className="medical-card-metric">
            <div className="metric-label mb-2">Lab Values</div>
            <div className="metric-value text-medical-warning-600">
              {reports.reduce((sum, r) => sum + (r._count?.metrics || 0), 0)}
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="medical-card-primary">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-medical-neutral-900">
              Recent Reports
            </h2>
            {reports.length > 0 && (
              <span className="text-sm text-medical-neutral-500">
                {reports.length} report{reports.length !== 1 ? 's' : ''} total
              </span>
            )}
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-medical-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-lg font-medium text-medical-neutral-900 mb-2">
                No reports uploaded yet
              </h3>
              <p className="text-medical-neutral-600 mb-6">
                Upload your first medical report to get started with health tracking
              </p>
              <Link href="/" className="btn-primary">
                <span className="mr-2">📄</span>
                Upload Your First Report
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {monthKeys.map((monthKey) => (
                <div key={monthKey}>
                  <div className="flex items-center mb-4">
                    <h3 className="text-lg font-medium text-medical-neutral-900">
                      {monthKey}
                    </h3>
                    <div className="ml-3 px-2 py-1 bg-medical-neutral-100 rounded-full text-xs font-medium text-medical-neutral-600">
                      {groups[monthKey].length} report{groups[monthKey].length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {groups[monthKey].map((report) => (
                      <Link
                        key={report.id}
                        href={`/reports/${report.id}`}
                        className="medical-card hover:shadow-lg transition-all duration-300 p-4 group"
                      >
      <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-medical-primary-100 rounded-lg flex items-center justify-center group-hover:bg-medical-primary-200 transition-colors">
                              <span className="text-lg">
                                {getFileTypeIcon(report.contentType || '')}
                              </span>
      </div>
                            
                            <div className="flex-1">
                              <h4 className="font-medium text-medical-neutral-900 group-hover:text-medical-primary-600 transition-colors">
                                {report.reportType || 'Medical Report'}
                              </h4>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="text-sm text-medical-neutral-600">
                                  {formatDate(report.reportDate ? new Date(report.reportDate) : report.createdAt)}
                                </span>
                                {report._count?.metrics > 0 && (
                                  <span className="text-xs bg-medical-success-100 text-medical-success-700 px-2 py-1 rounded-full">
                                    {report._count.metrics} lab value{report._count.metrics !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-medical-neutral-400 group-hover:text-medical-primary-500 transition-colors">
                              →
                            </span>
                          </div>
                        </div>
                  </Link>
                    ))}
                  </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}


