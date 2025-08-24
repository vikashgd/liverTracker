import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getMedicalPlatform } from "@/lib/medical-platform";
import { metricColors, referenceRanges, type CanonicalMetric } from '@/lib/metrics';

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

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || '6m';

    console.log(`🔗 Loading imaging-lab correlations for user: ${userId}, timeframe: ${timeframe}`);

    // Load imaging reports directly from database
    const { prisma } = await import("@/lib/db");
    
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

    // Transform reports to the expected format
    const imagingReports = reports.map(report => {
      let extractedData = report.extractedJson;
      if (typeof extractedData === 'string') {
        try {
          extractedData = JSON.parse(extractedData);
        } catch (e) {
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

    const validImagingReports = imagingReports.filter(report => 
      report.modality || report.organs.length > 0 || report.findings.length > 0
    );

    const imagingData = { reports: validImagingReports };
    
    if (!imagingData.reports || imagingData.reports.length === 0) {
      return NextResponse.json({
        correlations: [],
        count: 0
      });
    }

    // Load lab data using medical platform
    const platform = getMedicalPlatform();
    const labMetrics: CanonicalMetric[] = ['ALT', 'AST', 'Bilirubin', 'Albumin', 'Platelets'];
    
    const labData = await Promise.all(
      labMetrics.map(async (metric) => {
        try {
          const chartData = await platform.getChartData(userId, metric);
          return {
            metric,
            data: chartData.data.map(point => ({
              date: point.date.toISOString().split('T')[0],
              value: point.value
            }))
          };
        } catch (error) {
          console.warn(`Failed to load ${metric} data:`, error);
          return {
            metric,
            data: []
          };
        }
      })
    );

    // Create correlations
    const correlationData: any[] = [];

    imagingData.reports.forEach((report: any) => {
      // Find liver measurements
      const liverOrgan = report.organs.find((organ: any) => 
        organ.name.toLowerCase().includes('liver') && organ.size?.value
      );

      if (liverOrgan) {
        const reportDate = report.date.split('T')[0];
        
        // Find lab values within 30 days of imaging
        const nearbyLabValues: any[] = [];
        
        labData.forEach(({ metric, data }) => {
          const nearbyValue = data.find(point => {
            const daysDiff = Math.abs(
              new Date(point.date).getTime() - new Date(reportDate).getTime()
            ) / (1000 * 60 * 60 * 24);
            return daysDiff <= 30;
          });

          if (nearbyValue) {
            const range = referenceRanges[metric];
            let status: 'normal' | 'abnormal' | 'borderline' = 'normal';
            
            if (range) {
              if (nearbyValue.value < range.low * 0.8 || nearbyValue.value > range.high * 1.2) {
                status = 'abnormal';
              } else if (nearbyValue.value < range.low || nearbyValue.value > range.high) {
                status = 'borderline';
              }
            }

            nearbyLabValues.push({
              metric,
              value: nearbyValue.value,
              unit: range?.unit || '',
              status
            });
          }
        });

        if (nearbyLabValues.length > 0) {
          // Analyze correlations
          const altAst = nearbyLabValues.filter(v => v.metric === 'ALT' || v.metric === 'AST');
          const synthetic = nearbyLabValues.filter(v => v.metric === 'Albumin' || v.metric === 'Platelets');
          
          const liverEnzymes = altAst.some(v => v.status === 'abnormal') ? 'elevated' : 
                             altAst.some(v => v.status === 'borderline') ? 'normal' : 'normal';
          
          const syntheticFunction = synthetic.some(v => v.status === 'abnormal') ? 'impaired' : 'normal';
          
          const overallTrend = (liverEnzymes === 'elevated' || syntheticFunction === 'impaired') ? 'concerning' : 'stable';

          correlationData.push({
            imagingDate: reportDate,
            organSize: liverOrgan.size.value,
            organUnit: liverOrgan.size.unit,
            labValues: nearbyLabValues,
            correlation: {
              liverEnzymes,
              syntheticFunction,
              overallTrend
            }
          });
        }
      }
    });

    // Filter by timeframe
    const cutoffDate = new Date();
    switch (timeframe) {
      case '3m':
        cutoffDate.setMonth(cutoffDate.getMonth() - 3);
        break;
      case '6m':
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        break;
      case '1y':
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
      default:
        cutoffDate.setFullYear(2000); // Show all
    }

    const filteredCorrelations = correlationData.filter(c => 
      new Date(c.imagingDate) >= cutoffDate
    );

    const sortedCorrelations = filteredCorrelations.sort((a, b) => 
      new Date(b.imagingDate).getTime() - new Date(a.imagingDate).getTime()
    );

    console.log(`🔗 Returning ${sortedCorrelations.length} imaging-lab correlations`);

    return NextResponse.json({
      correlations: sortedCorrelations,
      count: sortedCorrelations.length
    });

  } catch (error) {
    console.error('Failed to load imaging-lab correlations:', error);
    return NextResponse.json(
      { error: "Failed to load imaging-lab correlations" },
      { status: 500 }
    );
  }
}