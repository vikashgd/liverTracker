import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { safeQuery } from "@/lib/db-utils";
import { getCurrentUserId } from "@/lib/auth";
import { getMedicalPlatform } from "@/lib/medical-platform";
import { enhancedUnitConverter } from "@/lib/medical-platform/core/enhanced-unit-converter";
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
      
      // Process with timeout and retry logic
      const processingResult = await Promise.race([
        platform.processAIExtraction(userId, data.extracted, safeDate, data.objectKey),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Processing timeout after 30 seconds')), 30000)
        )
      ]) as any;

      if (processingResult.success) {
        console.log(`✅ Medical Platform processed ${processingResult.summary.valuesProcessed} values with quality score ${processingResult.summary.qualityScore.toFixed(2)}`);
        
        // Create timeline event for platform processing (with error handling)
        try {
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
        } catch (timelineError) {
          console.warn('⚠️ Timeline event creation failed, but report was saved successfully');
        }

        return NextResponse.json({ 
          id: processingResult.report.id,
          processed: true,
          platform: 'medical_platform_v1',
          summary: processingResult.summary,
          warnings: processingResult.warnings,
          quality: processingResult.report.quality
        });
      } else {
        console.warn('⚠️ Medical Platform processing failed, falling back to enhanced legacy system');
        console.warn('Errors:', processingResult.errors);
        
        // Fall back to enhanced legacy processing
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
    
    // Try one more time with legacy processing as final fallback
    try {
      console.log('🔄 Attempting final fallback to legacy processing...');
      const fallbackResult = await processLegacyReport(data, userId, safeDate);
      
      return NextResponse.json({
        ...fallbackResult,
        warning: 'Processed using fallback system due to platform error',
        platform: 'emergency_fallback'
      });
    } catch (fallbackError) {
      console.error('❌ Even fallback processing failed:', fallbackError);
      
      // Create a minimal report as last resort
      try {
        const minimalReport = await prisma.reportFile.create({
          data: {
            userId: userId,
            objectKey: data.objectKey,
            contentType: data.contentType,
            reportType: data.reportType ?? "Document",
            reportDate: safeDate,
            extractedJson: data.extracted ?? undefined,
          },
        });

        return NextResponse.json({
          id: minimalReport.id,
          processed: false,
          warning: 'Report saved but processing failed',
          platform: 'minimal_fallback'
        });
      } catch (minimalError) {
        console.error('❌ Even minimal report creation failed:', minimalError);
        return NextResponse.json(
          { 
            error: "Complete report processing failure", 
            details: error instanceof Error ? error.message : String(error),
            fallback: "Please try again or contact support",
            timestamp: new Date().toISOString()
          }, 
          { status: 500 }
        );
      }
    }
  }
}

/**
 * Legacy report processing for backward compatibility
 * Enhanced with unit conversion to ensure consistency
 */
async function processLegacyReport(data: any, userId: string, safeDate: Date) {
  console.log('🔄 Using legacy report processing with unit conversion...');
  
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

  // Enhanced metric processing with unit conversion (using existing schema)
  if (data.extracted?.metrics) {
    const metricsRows = Object.entries(data.extracted.metrics)
      .filter(([, v]) => v !== null)
      .map(([name, v]) => {
        const vv = v as { value: number | null; unit: string | null };
        const converted = applyLegacyUnitConversion(name, vv.value, vv.unit);
        return {
          reportId: report.id,
          name,
          value: converted.value ?? undefined,
          unit: converted.unit ?? undefined,
        };
      });
    if (metricsRows.length > 0) {
      await prisma.extractedMetric.createMany({ data: metricsRows });
    }
  }

  if (data.extracted?.metricsAll && data.extracted.metricsAll.length > 0) {
    const rows = data.extracted.metricsAll.map((m: any) => {
      const converted = applyLegacyUnitConversion(m.name, m.value, m.unit);
      return {
        reportId: report.id,
        name: m.name,
        category: m.category ?? undefined,
        value: converted.value ?? undefined,
        unit: converted.unit ?? undefined,
      };
    });
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
    platform: 'legacy_fallback_enhanced',
    note: 'Processed using enhanced legacy system with unit conversion'
  });
}



/**
 * Apply unit conversion in legacy processing (DEPRECATED - use applyComprehensiveUnitConversion)
 * Safe fallback conversion for critical metrics
 */
function applyLegacyUnitConversion(metricName: string, value: number | null, unit: string | null): {
  value: number | null;
  unit: string | null;
} {
  if (value === null || value === undefined || isNaN(value)) {
    return { value, unit };
  }

  const name = metricName.toLowerCase();
  
  // Platelet conversion (most critical)
  if (name.includes('platelet') || name.includes('plt')) {
    // Convert raw count (/μL) to standard (×10³/μL)
    if (value >= 50000 && value <= 1000000) {
      console.log(`🔧 Legacy conversion: Platelets ${value}/μL → ${value * 0.001} ×10³/μL`);
      return { value: value * 0.001, unit: '×10³/μL' };
    }
    // Convert lakhs to standard
    if (value >= 0.5 && value <= 10 && (unit?.includes('lakh') || value < 50)) {
      console.log(`🔧 Legacy conversion: Platelets ${value} lakhs → ${value * 100} ×10³/μL`);
      return { value: value * 100, unit: '×10³/μL' };
    }
    return { value, unit: unit || '×10³/μL' };
  }

  // Bilirubin conversion
  if (name.includes('bilirubin') || name.includes('bil')) {
    // Convert μmol/L to mg/dL
    if (value >= 5 && value <= 500 && (unit?.includes('μmol') || unit?.includes('umol'))) {
      console.log(`🔧 Legacy conversion: Bilirubin ${value} μmol/L → ${(value / 17.1).toFixed(2)} mg/dL`);
      return { value: value / 17.1, unit: 'mg/dL' };
    }
    return { value, unit: unit || 'mg/dL' };
  }

  // Creatinine conversion
  if (name.includes('creatinine') || name.includes('crea')) {
    // Convert μmol/L to mg/dL
    if (value >= 30 && value <= 900 && (unit?.includes('μmol') || unit?.includes('umol'))) {
      console.log(`🔧 Legacy conversion: Creatinine ${value} μmol/L → ${(value / 88.4).toFixed(2)} mg/dL`);
      return { value: value / 88.4, unit: 'mg/dL' };
    }
    return { value, unit: unit || 'mg/dL' };
  }

  // Albumin conversion
  if (name.includes('albumin') || name.includes('alb')) {
    // Convert g/L to g/dL
    if (value >= 15 && value <= 70 && (unit?.includes('g/L') || value > 10)) {
      console.log(`🔧 Legacy conversion: Albumin ${value} g/L → ${(value / 10).toFixed(1)} g/dL`);
      return { value: value / 10, unit: 'g/dL' };
    }
    return { value, unit: unit || 'g/dL' };
  }

  // No conversion needed - return as is
  return { value, unit };
}

export async function GET() {
  try {
    const reports = await safeQuery(() => 
      prisma.reportFile.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          reportType: true,
          reportDate: true,
          createdAt: true,
          objectKey: true,
          contentType: true,
        },
      })
    );
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch reports", 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
}


