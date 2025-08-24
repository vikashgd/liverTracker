import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ReportDetailClient } from "./report-detail-client";

export default async function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireAuth();
  
  const report = await prisma.reportFile.findUnique({
    where: { id, userId },
    include: { metrics: true },
  });
  if (!report) return <main className="container mx-auto p-6">Not found</main>;

  return <ReportDetailClient report={report} userId={userId} />;
}