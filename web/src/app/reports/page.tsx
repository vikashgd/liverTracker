import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ReportsInterface } from "@/components/reports-interface";

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

  // Transform to match client interface
  const transformedReports = reports.map(report => ({
    ...report,
    reportDate: report.reportDate ? new Date(report.reportDate) : null,
    createdAt: new Date(report.createdAt)
  }));

  return <ReportsInterface reports={transformedReports} />;
}
