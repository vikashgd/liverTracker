import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GCSStorage } from "@/lib/storage/gcs";
import { buildSummaryPdf } from "@/lib/pdf/summary";
import { renderToBuffer } from "@react-pdf/renderer";
import { canonicalizeMetricName, referenceRanges, type CanonicalMetric } from "@/lib/metrics";

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  // Get latest metrics for each canonical metric
  const { metricSynonyms } = await import("@/lib/metrics");
  const latestMetrics = await Promise.all(
    (["ALT", "AST", "Platelets", "Bilirubin", "Albumin"] as CanonicalMetric[]).map(async (metric) => {
      const synonymKeys = Object.keys(metricSynonyms).filter(n => canonicalizeMetricName(n) === metric);
      const latest = await prisma.extractedMetric.findFirst({
        where: { 
          report: { userId },
          name: { in: synonymKeys }
        },
        orderBy: { createdAt: "desc" },
        select: { value: true, unit: true, name: true, createdAt: true },
      });

      if (!latest || latest.value == null) return null;

      const range = referenceRanges[metric];
      let status: "normal" | "high" | "low" = "normal";
      if (latest.value < range.low) status = "low";
      else if (latest.value > range.high) status = "high";

      return {
        name: metric,
        value: latest.value,
        unit: latest.unit || range.unit,
        range,
        status,
      };
    })
  );

  // Get recent timeline events
  const timelineEvents = await prisma.timelineEvent.findMany({
    where: { userId },
    orderBy: { occurredAt: "desc" },
    take: 10,
    include: { 
      report: { 
        select: { reportType: true, reportDate: true, createdAt: true } 
      } 
    },
  });

  const timeline = timelineEvents.map(event => ({
    date: (event.report?.reportDate || event.occurredAt).toISOString().slice(0, 10),
    type: event.type,
    reportType: event.report?.reportType || undefined,
  }));

  // TODO: Generate chart images (this would require server-side chart rendering)
  // For now, we'll generate the PDF without chart images
  const chartImages: Array<{ title: string; imageData: string }> = [];

  const content = await renderToBuffer(
    buildSummaryPdf({
      brandName: "LiverTrack",
      patient: {
        id: userId,
        // TODO: Add actual patient data when user profiles are implemented
      },
      timeline,
      latestMetrics: latestMetrics.filter((m): m is NonNullable<typeof m> => m !== null),
      chartImages,
    })
  );

  const storage = new GCSStorage();
  const key = `exports/summary-${userId}-${Date.now()}.pdf`;
  await storage.putObject(key, content, "application/pdf");
  const { url } = await storage.signDownloadURL({ key });
  
  return NextResponse.json({ url });
}
