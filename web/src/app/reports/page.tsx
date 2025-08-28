import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ReportsInterface } from "@/components/reports-interface";

export default async function ReportsPage() {
  const userId = await requireAuth();
  
  const reports = await prisma.reportFile.findMany({
    where: { userId },
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

  // Transform and sort properly handling null reportDate values
  const transformedReports = reports
    .map(report => ({
      ...report,
      reportDate: report.reportDate ? new Date(report.reportDate) : null,
      createdAt: new Date(report.createdAt)
    }))
    .sort((a, b) => {
      // Primary sort: reportDate (null values go to end)
      const dateA = a.reportDate;
      const dateB = b.reportDate;
      
      // If both have reportDate, sort by reportDate desc (newest first)
      if (dateA && dateB) {
        return dateB.getTime() - dateA.getTime();
      }
      
      // If only one has reportDate, prioritize the one with reportDate
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;
      
      // If both are null, sort by createdAt desc (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  // Debug logging to understand the sorting
  console.log('📋 Reports sorting debug:', transformedReports.map(r => ({
    id: r.id.slice(-8),
    reportDate: r.reportDate?.toISOString().split('T')[0] || 'null',
    createdAt: r.createdAt.toISOString().split('T')[0],
    reportType: r.reportType
  })));

  return <ReportsInterface reports={transformedReports} />;
}
