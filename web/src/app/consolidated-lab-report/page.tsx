import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ConsolidatedLabReport } from "@/components/consolidated-lab-report";

export default async function ConsolidatedLabReportPage() {
  const userId = await requireAuth();
  
  console.log('🔍 Fetching consolidated lab report for user:', userId);
  
  // First, let's see what reports exist
  const allReports = await prisma.reportFile.findMany({
    where: { userId },
    select: {
      id: true,
      reportType: true,
      reportDate: true,
      createdAt: true,
      _count: { select: { metrics: true } }
    }
  });
  
  console.log('📊 All reports found:', allReports.length);
  console.log('📋 Report types:', allReports.map(r => ({ type: r.reportType, metrics: r._count.metrics, date: r.reportDate || r.createdAt })));
  
  // Fetch ALL reports with metrics - be completely inclusive
  const reports = await prisma.reportFile.findMany({
    where: { 
      userId,
      metrics: { some: {} } // Any report that has metrics
    },
    include: { 
      metrics: true
    },
    orderBy: { reportDate: 'asc' }
  });

  console.log('🔬 Reports with metrics found:', reports.length);
  console.log('📈 Total metrics across all reports:', reports.reduce((sum, r) => sum + r.metrics.length, 0));
  
  // Log detailed metric information
  if (reports.length > 0) {
    console.log('📝 All available metric names:', [...new Set(reports.flatMap(r => r.metrics.map(m => m.name)))].sort());
    
    // Check for MELD calculation parameters
    const meldParams = ['Bilirubin', 'Creatinine', 'INR', 'Sodium'];
    meldParams.forEach(param => {
      const found = reports.flatMap(r => r.metrics).filter(m => 
        m.name.toLowerCase().includes(param.toLowerCase()) || 
        m.name.toLowerCase().includes('bilirubin') ||
        m.name.toLowerCase().includes('creatinine') ||
        m.name.toLowerCase().includes('inr') ||
        m.name.toLowerCase().includes('sodium')
      );
      console.log(`🔍 ${param} related metrics:`, found.map(m => ({ name: m.name, value: m.value, unit: m.unit })));
    });
    
    // Log sample metrics from first few reports
    reports.slice(0, 3).forEach((report, index) => {
      console.log(`📋 Report ${index + 1} (${report.reportType}):`, report.metrics.map(m => ({ name: m.name, value: m.value, unit: m.unit })));
    });
  }

  // Transform data for the consolidated view
  const labData = reports.map(report => ({
    id: report.id,
    date: report.reportDate ? new Date(report.reportDate) : new Date(report.createdAt),
    reportType: report.reportType,
    metrics: report.metrics.map(metric => ({
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      textValue: metric.textValue
    }))
  }));

  console.log('🔄 Transformed lab data:', labData.length, 'data points');
  console.log('📅 Date range:', labData.length > 0 ? `${labData[0]?.date} to ${labData[labData.length - 1]?.date}` : 'No data');

  return <ConsolidatedLabReport labData={labData} />;
}
