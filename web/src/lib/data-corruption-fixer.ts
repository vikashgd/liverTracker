/**
 * DATA CORRUPTION FIXER
 * Identifies and corrects corrupted platelet values from double unit conversion
 */

import { prisma } from "@/lib/db";
import { UnifiedMedicalEngine, UNIFIED_MEDICAL_PARAMETERS } from "./unified-medical-engine";

export interface DataCorruptionAnalysis {
  corruptedRecords: Array<{
    id: string;
    reportId: string;
    originalValue: number;
    correctedValue: number;
    originalUnit: string;
    reason: string;
    confidence: string;
  }>;
  summary: {
    totalRecords: number;
    corruptedCount: number;
    correctionsMade: number;
  };
}

export class DataCorruptionFixer {
  
  /**
   * Identify corrupted platelet data
   */
  static async analyzeCorruption(userId: string): Promise<DataCorruptionAnalysis> {
    const parameter = UNIFIED_MEDICAL_PARAMETERS['Platelets'];
    const allPossibleNames = ['Platelets', ...parameter.synonyms];
    
    // Get all platelet data
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
            reportType: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const corruptedRecords = [];
    
    for (const record of plateletsData) {
      if (record.value === null) continue;
      
      // Process through unified engine
      const processed = UnifiedMedicalEngine.processValue('Platelets', record.value, record.unit);
      
      // Identify corruption patterns
      const corruptionReason = this.identifyCorruption(record.value, record.unit, processed);
      
      if (corruptionReason) {
        const correctedValue = this.calculateCorrection(record.value, record.unit, corruptionReason);
        
        corruptedRecords.push({
          id: record.id,
          reportId: record.report.id,
          originalValue: record.value,
          correctedValue,
          originalUnit: record.unit || 'unknown',
          reason: corruptionReason,
          confidence: processed.confidence
        });
      }
    }
    
    return {
      corruptedRecords,
      summary: {
        totalRecords: plateletsData.length,
        corruptedCount: corruptedRecords.length,
        correctionsMade: 0 // Will be updated after fixes
      }
    };
  }
  
  /**
   * Identify specific corruption patterns
   */
  private static identifyCorruption(value: number, unit: string | null, processed: any): string | null {
    // Pattern 1: Values that are 100-1000x too high for their stated unit
    if (unit === '10^9/L' && value > 1000) {
      return 'double_conversion_10_9_L'; // Raw count incorrectly labeled as 10^9/L
    }
    
    // Pattern 2: Values in impossible ranges
    if (value > 10000 && (unit === '10^9/L' || unit === '×10³/μL')) {
      return 'impossible_range_standard_unit';
    }
    
    // Pattern 3: Values that would be normal if divided by 1000
    if (value > 50000 && value < 1000000) {
      const corrected = value / 1000;
      if (corrected >= 50 && corrected <= 1000) {
        return 'raw_count_mislabeled'; // Raw count needs conversion to 10^9/L
      }
    }
    
    // Pattern 4: Ultra-high confidence but impossible values
    if (processed.confidence === 'high' && processed.normalizedValue > 2000) {
      return 'high_confidence_impossible';
    }
    
    // Pattern 5: Values that would be normal if in different unit
    if (value > 10000) {
      // Check if this would be normal as raw count /μL
      const asRawCount = value * 0.001; // Convert /μL to 10^9/L
      if (asRawCount >= 150 && asRawCount <= 450) {
        return 'should_be_raw_count';
      }
    }
    
    return null;
  }
  
  /**
   * Calculate the corrected value
   */
  private static calculateCorrection(value: number, unit: string | null, reason: string): number {
    switch (reason) {
      case 'double_conversion_10_9_L':
      case 'impossible_range_standard_unit':
      case 'raw_count_mislabeled':
      case 'should_be_raw_count':
        // These are likely raw counts that should be converted to 10^9/L
        return value * 0.001;
        
      case 'high_confidence_impossible':
        // Try various correction factors
        if (value > 50000) return value * 0.001; // /μL to 10^9/L
        if (value > 5000) return value * 0.01;   // Alternative conversion
        return value * 0.1; // Last resort
        
      default:
        return value;
    }
  }
  
  /**
   * Apply corrections to the database
   */
  static async applyCorrections(userId: string, corrections: DataCorruptionAnalysis['corruptedRecords']): Promise<{
    success: boolean;
    correctionsMade: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let correctionsMade = 0;
    
    for (const correction of corrections) {
      try {
        // Verify the correction makes sense
        const processedCorrected = UnifiedMedicalEngine.processValue(
          'Platelets', 
          correction.correctedValue, 
          '10^9/L'
        );
        
        // Only apply if the correction results in valid data
        if (processedCorrected.isValid && processedCorrected.confidence !== 'reject') {
          await prisma.extractedMetric.update({
            where: { id: correction.id },
            data: {
              value: correction.correctedValue,
              unit: '10^9/L' // Standardize unit
            }
          });
          
          correctionsMade++;
          console.log(`✅ Corrected ${correction.originalValue} → ${correction.correctedValue} (${correction.reason})`);
        } else {
          errors.push(`Correction for ${correction.originalValue} would still be invalid`);
        }
        
      } catch (error) {
        errors.push(`Failed to correct record ${correction.id}: ${error}`);
      }
    }
    
    return {
      success: errors.length === 0,
      correctionsMade,
      errors
    };
  }
  
  /**
   * Comprehensive data cleanup for a user
   */
  static async cleanupUserData(userId: string): Promise<{
    analysisResult: DataCorruptionAnalysis;
    correctionResult: Awaited<ReturnType<typeof DataCorruptionFixer.applyCorrections>>;
  }> {
    console.log(`🔍 Analyzing data corruption for user: ${userId}`);
    
    // Step 1: Analyze corruption
    const analysisResult = await this.analyzeCorruption(userId);
    
    console.log(`📊 Analysis complete:`, {
      totalRecords: analysisResult.summary.totalRecords,
      corruptedCount: analysisResult.summary.corruptedCount,
      corruptionPatterns: analysisResult.corruptedRecords.map(r => r.reason)
    });
    
    // Step 2: Apply corrections for high-confidence fixes
    const highConfidenceCorrections = analysisResult.corruptedRecords.filter(r => 
      ['double_conversion_10_9_L', 'raw_count_mislabeled', 'should_be_raw_count'].includes(r.reason)
    );
    
    const correctionResult = await this.applyCorrections(userId, highConfidenceCorrections);
    
    // Update summary
    analysisResult.summary.correctionsMade = correctionResult.correctionsMade;
    
    return {
      analysisResult,
      correctionResult
    };
  }
}
