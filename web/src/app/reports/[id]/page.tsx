import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { DeleteReportButton } from "@/components/delete-report-button";
import { PDFViewer } from "@/components/pdf-viewer";
import Link from "next/link";

export default async function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireAuth();
  
  const report = await prisma.reportFile.findUnique({
    where: { id, userId },
    include: { metrics: true },
  });
  if (!report) return <main className="container mx-auto p-6">Not found</main>;

  const labs = report.metrics.filter((m) => m.category !== "imaging");
  const imaging = report.metrics.filter((m) => m.category === "imaging");

  // Categorize report for better styling
  const categorizeReport = (reportType: string | null) => {
    const type = (reportType || '').toLowerCase();
    if (type.includes('lab') || type.includes('blood') || type.includes('chemistry')) {
      return { icon: '🧪', color: 'red', label: 'Laboratory Report' };
    }
    if (type.includes('ct') || type.includes('mri') || type.includes('ultrasound') || type.includes('x-ray')) {
      return { icon: '🏥', color: 'blue', label: 'Imaging Study' };
    }
    if (type.includes('manual') || type.includes('visit') || type.includes('consultation')) {
      return { icon: '👩‍⚕️', color: 'green', label: 'Clinical Notes' };
    }
    return { icon: '📋', color: 'gray', label: 'Medical Report' };
  };

  const config = categorizeReport(report.reportType);
  
  const getColorClasses = (color: string) => {
    const colorMap = {
      red: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', accent: 'text-red-600' },
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', accent: 'text-blue-600' },
      green: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', accent: 'text-green-600' },
      gray: { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-700', accent: 'text-gray-600' }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  const colors = getColorClasses(config.color);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <Link 
                href="/reports" 
                className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium"
              >
                <span className="mr-2">←</span>
                Back to Reports
              </Link>
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${colors.bg}`}>
                  <span className="text-3xl">{config.icon}</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {report.reportType || 'Medical Report'}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <span>📅 {formatDate(report.reportDate || report.createdAt)}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.badge}`}>
                      {config.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <button className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium">
                <span className="mr-2">📄</span>
                View Original PDF
              </button>
              <ExportPdfButton reportId={report.id} />
              <DeleteReportButton reportId={report.id} />
            </div>
          </div>
        </div>

        {/* Report Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-xl">🧪</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Lab Values</p>
                <p className="text-2xl font-bold text-gray-900">{labs.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-xl">🏥</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Imaging Findings</p>
                <p className="text-2xl font-bold text-gray-900">{imaging.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Metrics</p>
                <p className="text-2xl font-bold text-gray-900">{labs.length + imaging.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Laboratory Results */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-200">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🧪</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Laboratory Results</h2>
                  <p className="text-sm text-gray-600">
                    {labs.length} {labs.length === 1 ? 'metric' : 'metrics'} detected
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {labs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🧪</span>
                  </div>
                  <p className="text-gray-600">No laboratory metrics detected in this report.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {labs.map((metric) => (
                    <div key={metric.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                          {metric.textValue && (
                            <p className="text-sm text-gray-600 mt-1">{metric.textValue}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {metric.value || '—'}
                          </div>
                          {metric.unit && (
                            <div className="text-sm text-gray-500">{metric.unit}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Link 
                  href={`/reports/${report.id}/edit`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <span className="mr-2">✏️</span>
                  Edit Lab Values
                </Link>
              </div>
            </div>
          </div>

          {/* Imaging Results */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🏥</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Imaging Studies</h2>
                  <p className="text-sm text-gray-600">
                    {imaging.length} {imaging.length === 1 ? 'finding' : 'findings'} documented
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {imaging.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🏥</span>
                  </div>
                  <p className="text-gray-600">No imaging findings detected in this report.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {imaging.map((metric) => (
                    <div key={metric.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <h3 className="font-semibold text-gray-900 mb-2">{metric.name}</h3>
                      {metric.value != null && (
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg font-bold text-gray-900">{metric.value}</span>
                          {metric.unit && <span className="text-sm text-gray-500">{metric.unit}</span>}
                        </div>
                      )}
                      {metric.textValue && (
                        <p className="text-sm text-gray-700 leading-relaxed">{metric.textValue}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left">
              <span className="text-2xl">📄</span>
              <div>
                <div className="font-medium text-gray-900">View Original</div>
                <div className="text-sm text-gray-600">See the raw PDF document</div>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-left">
              <span className="text-2xl">📧</span>
              <div>
                <div className="font-medium text-gray-900">Share</div>
                <div className="text-sm text-gray-600">Send to your doctor</div>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-left">
              <span className="text-2xl">📊</span>
              <div>
                <div className="font-medium text-gray-900">View Trends</div>
                <div className="text-sm text-gray-600">See how values changed</div>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors text-left">
              <span className="text-2xl">💾</span>
              <div>
                <div className="font-medium text-gray-900">Download</div>
                <div className="text-sm text-gray-600">Get PDF summary</div>
              </div>
            </button>
          </div>
        </div>

        {/* Report Metadata */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Report Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <span className="font-medium text-gray-700">Report Type:</span>
              <div className="text-gray-900">{report.reportType || 'Unknown'}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Report Date:</span>
              <div className="text-gray-900">
                {report.reportDate ? formatDate(report.reportDate) : 'No date specified'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">File:</span>
              <div className="text-gray-900 truncate">{report.objectKey}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}