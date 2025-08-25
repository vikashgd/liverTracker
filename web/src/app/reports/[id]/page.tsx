import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ReportDetailClient } from "./report-detail-client";

export default async function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireAuth();
  
  // Safely query report with metrics, handling potential missing fields
  const report = await prisma.reportFile.findUnique({
    where: { id, userId },
    include: { 
      metrics: {
        select: {
          id: true,
          reportId: true,
          name: true,
          value: true,
          unit: true,
          createdAt: true,
          category: true,
          textValue: true,
          // Only include new fields if they exist (graceful handling)
          // originalValue: true,
          // originalUnit: true,
          // wasConverted: true,
          // conversionFactor: true,
          // conversionRule: true,
          // conversionDate: true,
          // validationStatus: true,
          // validationNotes: true,
        }
      }
    },
  });
  if (!report) return <main className="container mx-auto p-6">Not found</main>;

  return <ReportDetailClient report={report} userId={userId} />;
}