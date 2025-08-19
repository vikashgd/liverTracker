import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log(`📊 Loading imaging reports for user: ${userId}`);

    // Fetch reports that contain imaging data
    const reports = await prisma.reportFile.findMany({
      where: {
        userId,
        OR: [
          { reportType: { contains: 'ultrasound', mode: 'insensitive' } },
          { reportType: { contains: 'ct', mode: 'insensitive' } },
          { reportType: { contains: 'mri', mode: 'insensitive' } },
          { reportType: { equals: 'Ultrasound' } },
          { reportType: { equals: 'CT' } },
          { reportType: { equals: 'MRI' } },
          {
            // Also include reports that have imaging data in extracted content
            extractedJson: {
              path: ['imaging'],
              not: {}
            }
          }
        ]
      },
      orderBy: {
        reportDate: 'desc'
      }
    });

    console.log(`📊 Found ${reports.length} imaging reports`);

    // Transform reports to the expected format
    const imagingReports = reports.map(report => {
      // Parse extracted data from JSON field
      let extractedData = report.extractedJson;
      if (typeof extractedData === 'string') {
        try {
          extractedData = JSON.parse(extractedData);
        } catch (e) {
          console.warn('Failed to parse extracted data:', e);
          extractedData = null;
        }
      }

      const imaging = (extractedData && typeof extractedData === 'object' && 'imaging' in extractedData) 
        ? (extractedData as any).imaging || {} 
        : {};
      
      return {
        id: report.id,
        date: report.reportDate?.toISOString() || report.createdAt.toISOString(),
        reportType: report.reportType || 'Imaging Report',
        modality: imaging.modality || detectModalityFromReportType(report.reportType),
        organs: Array.isArray(imaging.organs) ? imaging.organs : [],
        findings: Array.isArray(imaging.findings) ? imaging.findings : []
      };
    });

    // Filter out reports without any imaging data
    const validImagingReports = imagingReports.filter(report => 
      report.modality || report.organs.length > 0 || report.findings.length > 0
    );

    console.log(`📊 Returning ${validImagingReports.length} valid imaging reports`);

    return NextResponse.json({
      reports: validImagingReports,
      count: validImagingReports.length
    });

  } catch (error) {
    console.error('Failed to load imaging reports:', error);
    return NextResponse.json(
      { error: "Failed to load imaging reports" },
      { status: 500 }
    );
  }
}

// Helper function to detect modality from report type
function detectModalityFromReportType(reportType: string | null): string | null {
  if (!reportType) return null;
  
  const type = reportType.toLowerCase();
  if (type.includes('ultrasound') || type.includes('us') || type.includes('sonogram')) {
    return 'Ultrasound';
  }
  if (type.includes('ct') || type.includes('computed tomography') || type.includes('cat scan')) {
    return 'CT';
  }
  if (type.includes('mri') || type.includes('magnetic resonance') || type.includes('mr ')) {
    return 'MRI';
  }
  
  return null;
}
