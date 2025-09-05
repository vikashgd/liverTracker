import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { GCSStorage } from "@/lib/storage/gcs";
import { buildReportPdf } from "@/lib/pdf/report";
import { renderToBuffer } from "@react-pdf/renderer";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reportId = new URL(req.url).searchParams.get("reportId");
  if (!reportId) return NextResponse.json({ error: "Missing reportId" }, { status: 400 });

  const report = await prisma.reportFile.findUnique({ 
    where: { id: reportId, userId }, 
    include: { metrics: true, user: true } 
  });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const metrics = report.metrics.map((m) => ({
    name: m.name,
    value: m.value as number | null,
    unit: m.unit,
    textValue: (m as unknown as { textValue?: string | null }).textValue ?? null,
    category: m.category ?? null,
  }));
  const content = await renderToBuffer(
    buildReportPdf({
      brandName: "LiverTrack",
      report: {
        id: report.id,
        reportType: report.reportType,
        reportDate: report.reportDate ? new Date(report.reportDate).toISOString().slice(0, 10) : null,
        objectKey: report.objectKey,
      },
      metrics,
    })
  );
  const storage = new GCSStorage();
  const key = `exports/${report.id}-${Date.now()}.pdf`;
  await storage.putObject(key, content, "application/pdf");
  const signed = await storage.signDownloadURL({ key });
  if (!signed) {
    throw new Error('Failed to generate download URL for PDF');
  }
  const { url } = signed;
  return NextResponse.json({ url });
}


