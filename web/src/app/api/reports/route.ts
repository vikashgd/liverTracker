import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { SmartReportManager } from "@/lib/smart-report-manager";
import { z } from "zod";

const Body = z.object({
  objectKey: z.string(),
  contentType: z.string(),
  reportType: z.string().nullable().optional(),
  reportDate: z.string().datetime().nullable().optional(),
  extracted: z
    .object({
      reportType: z.string().nullable().optional(),
      reportDate: z.string().nullable().optional(),
      metrics: z
        .record(
          z.string(),
          z.union([z.object({ value: z.number().nullable(), unit: z.string().nullable() }), z.null()])
        )
        .nullable()
        .optional(),
      metricsAll: z
        .array(
          z.object({
            name: z.string(),
            value: z.number().nullable(),
            unit: z.string().nullable(),
            category: z.string().nullable().optional(),
          })
        )
        .nullable()
        .optional(),
      imaging: z
        .object({
          modality: z.string().nullable().optional(),
          organs: z
            .array(
              z.object({
                name: z.string(),
                size: z.object({ value: z.number().nullable(), unit: z.string().nullable() }).nullable().optional(),
                notes: z.string().nullable().optional(),
              })
            )
            .nullable()
            .optional(),
          findings: z.array(z.string()).nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = Body.parse(await req.json());

  const safeDate = (() => {
    const s = data.reportDate ?? data.extracted?.reportDate ?? null;
    if (!s) return undefined;
    const d = new Date(s);
    return isNaN(d.getTime()) ? undefined : d;
  })();

  // Check for duplicates if we have a date and metrics
  if (safeDate && (data.extracted?.metrics || data.extracted?.metricsAll)) {
    const reportData = {
      reportType: data.reportType ?? data.extracted?.reportType ?? "Unknown",
      reportDate: safeDate,
      metrics: [
        ...(data.extracted?.metrics ? Object.entries(data.extracted.metrics)
          .filter(([, v]) => v !== null && (v as any).value !== null)
          .map(([name, v]) => ({
            name,
            value: (v as any).value as number,
            unit: (v as any).unit,
            category: "extracted"
          })) : []),
        ...(data.extracted?.metricsAll || []).filter(m => m.value !== null)
      ].filter(m => m.value !== null) as Array<{
        name: string;
        value: number;
        unit?: string | null;
        category?: string;
      }>
    };

    if (reportData.metrics.length > 0) {
      const duplicateResult = await SmartReportManager.detectDuplicates(userId, reportData);
      
      if (duplicateResult.isDuplicate && duplicateResult.action === 'update_existing') {
        // Auto-merge without conflicts
        const mergeResult = await SmartReportManager.mergeReports(
          userId,
          reportData,
          duplicateResult.existingReportId!,
          { onDuplicate: 'keep_best_confidence', toleranceHours: 12, confidenceThreshold: 0.7 }
        );
        
        return NextResponse.json({ 
          id: mergeResult.mergedReportId,
          merged: true,
          summary: mergeResult.summary,
          duplicateInfo: duplicateResult
        });
      } else if (duplicateResult.isDuplicate && duplicateResult.action === 'user_decision_required') {
        // Return duplicate info for user decision
        return NextResponse.json({
          needsUserDecision: true,
          duplicateInfo: duplicateResult,
          reportData
        }, { status: 409 }); // Conflict status
      }
    }
  }

  const report = await prisma.reportFile.create({
    data: {
      userId: userId,
      objectKey: data.objectKey,
      contentType: data.contentType,
      reportType: data.reportType ?? data.extracted?.reportType ?? undefined,
      reportDate: safeDate,
      extractedJson: data.extracted ?? undefined,
    },
  });

  if (data.extracted?.metrics) {
    const metricsRows = Object.entries(data.extracted.metrics)
      .filter(([, v]) => v !== null)
      .map(([name, v]) => {
        const vv = v as { value: number | null; unit: string | null };
        return {
          reportId: report.id,
          name,
          value: vv.value ?? undefined,
          unit: vv.unit ?? undefined,
        };
      });
    if (metricsRows.length > 0) {
      await prisma.extractedMetric.createMany({ data: metricsRows });
    }
  }

  if (data.extracted?.metricsAll && data.extracted.metricsAll.length > 0) {
    const rows = data.extracted.metricsAll.map((m) => ({
      reportId: report.id,
      name: m.name,
      value: m.value ?? undefined,
      unit: m.unit ?? undefined,
      category: m.category ?? undefined,
    }));
    await prisma.extractedMetric.createMany({ data: rows });
  }

  // Create a timeline event for report saved
  await prisma.timelineEvent.create({
    data: {
      userId: userId,
      type: "report_saved",
      reportId: report.id,
      details: data.extracted ?? undefined,
    },
  });

  if (data.extracted?.imaging) {
    const organs = data.extracted.imaging.organs ?? [];
    if (organs.length > 0) {
      const rows = organs.map((o) => ({
        reportId: report.id,
        name: o.name,
        value: o.size?.value ?? undefined,
        unit: o.size?.unit ?? undefined,
        textValue: o.notes ?? undefined,
        category: "imaging",
      }));
      await prisma.extractedMetric.createMany({ data: rows });
    }
    const findings = data.extracted.imaging.findings ?? [];
    if (findings.length > 0) {
      const rows = findings.map((f) => ({
        reportId: report.id,
        name: "finding",
        textValue: f,
        category: "imaging",
      }));
      await prisma.extractedMetric.createMany({ data: rows });
    }
  }

  return NextResponse.json({ id: report.id });
}

export async function GET() {
  const reports = await prisma.reportFile.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      reportType: true,
      reportDate: true,
      createdAt: true,
      objectKey: true,
      contentType: true,
    },
  });
  return NextResponse.json(reports);
}


