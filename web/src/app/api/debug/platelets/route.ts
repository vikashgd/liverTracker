import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { UnifiedMedicalEngine, UNIFIED_MEDICAL_PARAMETERS } from "@/lib/unified-medical-engine";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all platelet data with full report context
  const parameter = UNIFIED_MEDICAL_PARAMETERS['Platelets'];
  const allPossibleNames = ['Platelets', ...parameter.synonyms];
  
  const plateletsData = await prisma.extractedMetric.findMany({
    where: {
      report: { userId },
      name: { in: allPossibleNames }
    },
    include: {
      report: {
        select: { 
          id: true,
          reportDate: true, 
          createdAt: true, 
          reportType: true,
          objectKey: true,
          extractedJson: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Process each data point through unified engine
  const analysisResults = plateletsData.map(item => {
    const processed = UnifiedMedicalEngine.processValue('Platelets', item.value!, item.unit);
    
    return {
      reportId: item.report.id,
      reportDate: item.report.reportDate?.toISOString().split('T')[0] || 'No date',
      reportType: item.report.reportType,
      objectKey: item.report.objectKey,
      
      // Original data
      originalValue: item.value,
      originalUnit: item.unit,
      extractedName: item.name,
      
      // Processed data
      normalizedValue: processed.normalizedValue,
      standardUnit: processed.standardUnit,
      confidence: processed.confidence,
      status: processed.status,
      isValid: processed.isValid,
      warnings: processed.warnings,
      suggestions: processed.suggestions,
      
      // Processing metadata
      conversionFactor: processed.metadata.conversionFactor,
      detectedUnit: processed.metadata.detectedUnit,
      processingMethod: processed.metadata.processingMethod,
      patternMatch: processed.metadata.patternMatch,
      
      // Raw extracted JSON (for debugging AI extraction)
      extractedJson: item.report.extractedJson
    };
  });

  // Identify problematic values
  const problematicValues = analysisResults.filter(item => 
    item.confidence === 'reject' || 
    item.normalizedValue > 1000 || // Suspiciously high
    !item.isValid ||
    item.warnings.length > 0
  );

  // Group by date to find duplicates
  const dateGroups = analysisResults.reduce((groups, item) => {
    const date = item.reportDate;
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {} as Record<string, typeof analysisResults>);

  const duplicateDates = Object.entries(dateGroups)
    .filter(([, items]) => items.length > 1)
    .map(([date, items]) => ({ date, items }));

  return NextResponse.json({
    summary: {
      totalRecords: analysisResults.length,
      problematicCount: problematicValues.length,
      duplicateDates: duplicateDates.length,
      validCount: analysisResults.filter(item => item.isValid).length,
      highConfidenceCount: analysisResults.filter(item => item.confidence === 'high').length,
    },
    allData: analysisResults,
    problematicValues,
    duplicateDates,
    
    // Value distribution analysis
    valueDistribution: {
      veryLow: analysisResults.filter(item => item.normalizedValue < 50).length,
      low: analysisResults.filter(item => item.normalizedValue >= 50 && item.normalizedValue < 150).length,
      normal: analysisResults.filter(item => item.normalizedValue >= 150 && item.normalizedValue <= 450).length,
      high: analysisResults.filter(item => item.normalizedValue > 450 && item.normalizedValue < 1000).length,
      veryHigh: analysisResults.filter(item => item.normalizedValue >= 1000).length,
    },
    
    // Unit analysis
    unitAnalysis: {
      unitsSeen: [...new Set(analysisResults.map(item => item.originalUnit))],
      processingMethods: [...new Set(analysisResults.map(item => item.processingMethod))],
      detectedUnits: [...new Set(analysisResults.map(item => item.detectedUnit))],
    }
  });
}
