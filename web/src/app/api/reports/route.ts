import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { getMedicalPlatform } from "@/lib/medical-platform";
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

  try {
    const data = Body.parse(await req.json());
    
    // Initialize the medical platform
    const platform = getMedicalPlatform({
      processing: {
        strictMode: false,
        autoCorrection: true,
        confidenceThreshold: 0.7,
        validationLevel: 'normal'
      },
      quality: {
        minimumConfidence: 0.5,
        requiredFields: ['ALT', 'AST', 'Platelets'],
        outlierDetection: true,
        duplicateHandling: 'merge'
      },
      regional: {
        primaryUnits: 'International',
        timeZone: 'UTC',
        locale: 'en-US'
      },
      compliance: {
        auditLevel: 'detailed',
        dataRetention: 2555,
        encryptionRequired: true
      }
    });

    const safeDate = (() => {
      const s = data.reportDate ?? data.extracted?.reportDate ?? null;
      if (!s) return new Date(); // Default to current date
      const d = new Date(s);
      return isNaN(d.getTime()) ? new Date() : d;
    })();

    console.log(`📊 Processing report for user ${userId} with date ${safeDate.toISOString()}`);

    // Process through the medical platform if we have extracted data
    if (data.extracted && (data.extracted.metrics || data.extracted.metricsAll)) {
      console.log('🔬 Processing through Medical Platform...');
      
      const processingResult = await platform.processAIExtraction(
        userId,
        data.extracted,
        safeDate,
        data.objectKey
      );

      if (processingResult.success) {
        console.log(`✅ Medical Platform processed ${processingResult.summary.valuesProcessed} values with quality score ${processingResult.summary.qualityScore.toFixed(2)}`);
        
        // Create timeline event for platform processing
        await prisma.timelineEvent.create({
          data: {
            userId: userId,
            type: "report_processed",
            reportId: processingResult.report.id,
            details: {
              platform: 'medical_platform_v1',
              summary: {
                valuesProcessed: processingResult.summary.valuesProcessed,
                valuesValid: processingResult.summary.valuesValid,
                averageConfidence: processingResult.summary.averageConfidence,
                processingTime: processingResult.summary.processingTime,
                qualityScore: processingResult.summary.qualityScore
              },
              qualityScore: processingResult.summary.qualityScore,
              originalExtracted: data.extracted
            } as any,
          },
        });

        return NextResponse.json({ 
          id: processingResult.report.id,
          processed: true,
          platform: 'medical_platform_v1',
          summary: processingResult.summary,
          warnings: processingResult.warnings,
          quality: processingResult.report.quality
        });
      } else {
        console.warn('⚠️ Medical Platform processing failed, falling back to legacy system');
        console.warn('Errors:', processingResult.errors);
        
        // Fall back to legacy processing if platform fails
        return await processLegacyReport(data, userId, safeDate);
      }
    } else {
      // No extracted data - create basic report
      console.log('📄 Creating basic report without extracted data');
      
      const report = await prisma.reportFile.create({
        data: {
          userId: userId,
          objectKey: data.objectKey,
          contentType: data.contentType,
          reportType: data.reportType ?? "Document",
          reportDate: safeDate,
          extractedJson: data.extracted ?? undefined,
        },
      });

      // Create timeline event
      await prisma.timelineEvent.create({
        data: {
          userId: userId,
          type: "report_saved",
          reportId: report.id,
          details: data.extracted ?? undefined,
        },
      });

      return NextResponse.json({ id: report.id, processed: false });
    }

  } catch (error) {
    console.error('❌ Report processing error:', error);
    
    return NextResponse.json(
      { 
        error: "Report processing failed", 
        details: error instanceof Error ? error.message : String(error),
        fallback: "Please try again or contact support"
      }, 
      { status: 500 }
    );
  }
}

/**
 * Legacy report processing for backward compatibility
 */
async function processLegacyReport(data: any, userId: string, safeDate: Date) {
  console.log('🔄 Using legacy report processing...');
  
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

  // Legacy metric processing
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
    const rows = data.extracted.metricsAll.map((m: any) => ({
      reportId: report.id,
      name: m.name,
      value: m.value ?? undefined,
      unit: m.unit ?? undefined,
      category: m.category ?? undefined,
    }));
    await prisma.extractedMetric.createMany({ data: rows });
  }

  // Legacy imaging processing
  if (data.extracted?.imaging) {
    const organs = data.extracted.imaging.organs ?? [];
    if (organs.length > 0) {
      const rows = organs.map((o: any) => ({
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
      const rows = findings.map((f: any) => ({
        reportId: report.id,
        name: "finding",
        textValue: f,
        category: "imaging",
      }));
      await prisma.extractedMetric.createMany({ data: rows });
    }
  }

  // Create timeline event
  await prisma.timelineEvent.create({
    data: {
      userId: userId,
      type: "report_saved",
      reportId: report.id,
      details: {
        ...data.extracted,
        processing: 'legacy_fallback'
      },
    },
  });

  return NextResponse.json({ 
    id: report.id, 
    processed: true,
    platform: 'legacy_fallback',
    note: 'Processed using legacy system due to platform error'
  });
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


