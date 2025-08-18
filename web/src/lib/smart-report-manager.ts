/**
 * SMART REPORT MANAGEMENT SYSTEM
 * Production-level solution for handling duplicate reports and data merging
 */

import { prisma } from "@/lib/db";
import { UnifiedMedicalEngine, UNIFIED_MEDICAL_PARAMETERS } from "./unified-medical-engine";
import { type CanonicalMetric } from "./metrics";

export interface ReportData {
  reportType: string;
  reportDate: Date;
  metrics: Array<{
    name: string;
    value: number;
    unit?: string | null;
    category?: string;
  }>;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  existingReportId?: string;
  conflictingMetrics: Array<{
    metric: string;
    existing: { value: number; unit: string; confidence: string };
    new: { value: number; unit: string; confidence: string };
    recommendation: 'keep_existing' | 'use_new' | 'merge_average' | 'manual_review';
  }>;
  action: 'create_new' | 'update_existing' | 'merge_reports' | 'user_decision_required';
}

export interface MergeStrategy {
  onDuplicate: 'replace' | 'average' | 'keep_best_confidence' | 'keep_latest' | 'ask_user';
  toleranceHours: number; // How many hours apart to consider "same day"
  confidenceThreshold: number; // Minimum confidence to auto-merge
}

export class SmartReportManager {
  
  /**
   * Detect if a report is a duplicate and suggest action
   */
  static async detectDuplicates(
    userId: string,
    reportData: ReportData,
    strategy: MergeStrategy = {
      onDuplicate: 'keep_best_confidence',
      toleranceHours: 12,
      confidenceThreshold: 0.7
    }
  ): Promise<DuplicateDetectionResult> {
    
    // Find existing reports within tolerance window
    const startTime = new Date(reportData.reportDate);
    startTime.setHours(startTime.getHours() - strategy.toleranceHours);
    
    const endTime = new Date(reportData.reportDate);
    endTime.setHours(endTime.getHours() + strategy.toleranceHours);
    
    const existingReports = await prisma.reportFile.findMany({
      where: {
        userId,
        reportDate: {
          gte: startTime,
          lte: endTime
        }
      },
      include: {
        metrics: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (existingReports.length === 0) {
      return {
        isDuplicate: false,
        conflictingMetrics: [],
        action: 'create_new'
      };
    }
    
    // Analyze metric conflicts
    const conflictingMetrics = [];
    let hasSignificantConflicts = false;
    
    for (const newMetric of reportData.metrics) {
      // Find matching metrics in existing reports
      for (const existingReport of existingReports) {
        const matchingMetric = existingReport.metrics.find(m => 
          this.isMetricMatch(m.name, newMetric.name)
        );
        
        if (matchingMetric && matchingMetric.value !== null) {
          // Process both values using unified engine
          const existingProcessed = UnifiedMedicalEngine.processValue(
            newMetric.name as CanonicalMetric,
            matchingMetric.value,
            matchingMetric.unit
          );
          
          const newProcessed = UnifiedMedicalEngine.processValue(
            newMetric.name as CanonicalMetric,
            newMetric.value,
            newMetric.unit
          );
          
          // Check for significant differences (>10% difference in normalized values)
          const percentDiff = Math.abs(existingProcessed.normalizedValue - newProcessed.normalizedValue) / 
                             Math.max(existingProcessed.normalizedValue, newProcessed.normalizedValue);
          
          if (percentDiff > 0.1) { // 10% threshold
            hasSignificantConflicts = true;
            
            const recommendation = this.getRecommendation(
              existingProcessed,
              newProcessed,
              strategy
            );
            
            conflictingMetrics.push({
              metric: newMetric.name,
              existing: {
                value: existingProcessed.normalizedValue,
                unit: existingProcessed.standardUnit,
                confidence: existingProcessed.confidence
              },
              new: {
                value: newProcessed.normalizedValue,
                unit: newProcessed.standardUnit,
                confidence: newProcessed.confidence
              },
              recommendation
            });
          }
        }
      }
    }
    
    // Determine action based on conflicts and strategy
    let action: DuplicateDetectionResult['action'];
    
    if (!hasSignificantConflicts) {
      action = 'update_existing'; // Safe to merge
    } else if (conflictingMetrics.every(c => c.recommendation !== 'manual_review')) {
      action = 'merge_reports'; // Can auto-resolve conflicts
    } else {
      action = 'user_decision_required'; // Manual intervention needed
    }
    
    return {
      isDuplicate: existingReports.length > 0,
      existingReportId: existingReports[0]?.id,
      conflictingMetrics,
      action
    };
  }
  
  /**
   * Smart merge of duplicate reports
   */
  static async mergeReports(
    userId: string,
    reportData: ReportData,
    existingReportId: string,
    strategy: MergeStrategy,
    userDecisions?: Record<string, 'keep_existing' | 'use_new'>
  ): Promise<{ success: boolean; mergedReportId: string; summary: string }> {
    
    return await prisma.$transaction(async (tx) => {
      // Get existing report with metrics
      const existingReport = await tx.reportFile.findUnique({
        where: { id: existingReportId, userId },
        include: { metrics: true }
      });
      
      if (!existingReport) {
        throw new Error('Existing report not found');
      }
      
      const mergedMetrics = [];
      const summary = [];
      
      // Process each new metric
      for (const newMetric of reportData.metrics) {
        const existingMetric = existingReport.metrics.find(m => 
          this.isMetricMatch(m.name, newMetric.name)
        );
        
        if (!existingMetric) {
          // New metric - just add it
          mergedMetrics.push({
            reportId: existingReportId,
            name: newMetric.name,
            value: newMetric.value,
            unit: newMetric.unit,
            category: newMetric.category
          });
          summary.push(`Added new metric: ${newMetric.name}`);
        } else if (existingMetric.value === null) {
          // Replace null existing value
          await tx.extractedMetric.update({
            where: { id: existingMetric.id },
            data: {
              value: newMetric.value,
              unit: newMetric.unit,
              category: newMetric.category
            }
          });
          summary.push(`Updated empty metric: ${newMetric.name}`);
        } else {
          // Handle conflict based on strategy and user decisions
          const userDecision = userDecisions?.[newMetric.name];
          const action = userDecision || strategy.onDuplicate;
          
          switch (action) {
            case 'replace':
            case 'use_new':
              await tx.extractedMetric.update({
                where: { id: existingMetric.id },
                data: {
                  value: newMetric.value,
                  unit: newMetric.unit,
                  category: newMetric.category
                }
              });
              summary.push(`Replaced ${newMetric.name}: ${existingMetric.value} → ${newMetric.value}`);
              break;
              
            case 'keep_existing':
              // Do nothing
              summary.push(`Kept existing ${newMetric.name}: ${existingMetric.value}`);
              break;
              
            case 'average':
              const avgValue = (existingMetric.value + newMetric.value) / 2;
              await tx.extractedMetric.update({
                where: { id: existingMetric.id },
                data: { value: avgValue }
              });
              summary.push(`Averaged ${newMetric.name}: ${avgValue.toFixed(2)}`);
              break;
              
            case 'keep_best_confidence':
              const existingProcessed = UnifiedMedicalEngine.processValue(
                newMetric.name as CanonicalMetric,
                existingMetric.value,
                existingMetric.unit
              );
              const newProcessed = UnifiedMedicalEngine.processValue(
                newMetric.name as CanonicalMetric,
                newMetric.value,
                newMetric.unit
              );
              
              if (this.getConfidenceScore(newProcessed.confidence) > 
                  this.getConfidenceScore(existingProcessed.confidence)) {
                await tx.extractedMetric.update({
                  where: { id: existingMetric.id },
                  data: {
                    value: newMetric.value,
                    unit: newMetric.unit,
                    category: newMetric.category
                  }
                });
                summary.push(`Used higher confidence ${newMetric.name}: ${newMetric.value} (${newProcessed.confidence})`);
              } else {
                summary.push(`Kept higher confidence ${newMetric.name}: ${existingMetric.value} (${existingProcessed.confidence})`);
              }
              break;
          }
        }
      }
      
      // Add any new metrics
      if (mergedMetrics.length > 0) {
        await tx.extractedMetric.createMany({
          data: mergedMetrics
        });
      }
      
      // Update report timestamp to latest
      await tx.reportFile.update({
        where: { id: existingReportId },
        data: {
          reportDate: reportData.reportDate,
          reportType: reportData.reportType // Update to latest type
        }
      });
      
      return {
        success: true,
        mergedReportId: existingReportId,
        summary: summary.join('; ')
      };
    });
  }
  
  /**
   * Get chart data with intelligent duplicate handling
   */
  static async getDeduplicatedChartData(
    userId: string,
    metric: CanonicalMetric
  ): Promise<Array<{ date: string; value: number; confidence: string; reportCount: number }>> {
    
    // Get all data for this metric
    const parameter = UNIFIED_MEDICAL_PARAMETERS[metric];
    if (!parameter) return [];
    
    const allPossibleNames = [metric, ...parameter.synonyms];
    
    const rawData = await prisma.extractedMetric.findMany({
      where: {
        report: { userId },
        name: { in: allPossibleNames }
      },
      include: {
        report: {
          select: { reportDate: true, createdAt: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    // Group by date and intelligently merge duplicates
    const dateGroups = new Map<string, Array<typeof rawData[0]>>();
    
    for (const item of rawData) {
      const date = (item.report.reportDate ?? item.report.createdAt).toISOString().split('T')[0];
      if (!dateGroups.has(date)) {
        dateGroups.set(date, []);
      }
      dateGroups.get(date)!.push(item);
    }
    
    // Process each date group
    const chartData = [];
    
    for (const [date, items] of dateGroups) {
      if (items.length === 1) {
        // Single value - process normally
        const processed = UnifiedMedicalEngine.processValue(metric, items[0].value!, items[0].unit);
        if (processed.confidence !== 'reject') {
          chartData.push({
            date,
            value: processed.normalizedValue,
            confidence: processed.confidence,
            reportCount: 1
          });
        }
      } else {
        // Multiple values - use best confidence or average
        const processedItems = items
          .filter(item => item.value !== null)
          .map(item => ({
            ...item,
            processed: UnifiedMedicalEngine.processValue(metric, item.value!, item.unit)
          }))
          .filter(item => item.processed.confidence !== 'reject');
        
        if (processedItems.length === 0) continue;
        
        // Find the highest confidence value
        const bestItem = processedItems.reduce((best, current) => 
          this.getConfidenceScore(current.processed.confidence) > 
          this.getConfidenceScore(best.processed.confidence) ? current : best
        );
        
        chartData.push({
          date,
          value: bestItem.processed.normalizedValue,
          confidence: bestItem.processed.confidence,
          reportCount: items.length
        });
      }
    }
    
    return chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  // Helper methods
  private static isMetricMatch(name1: string, name2: string): boolean {
    // Normalize names for comparison
    const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normalize(name1) === normalize(name2);
  }
  
  private static getConfidenceScore(confidence: string): number {
    switch (confidence) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }
  
  private static getRecommendation(
    existing: any,
    newValue: any,
    strategy: MergeStrategy
  ): 'keep_existing' | 'use_new' | 'merge_average' | 'manual_review' {
    
    const existingScore = this.getConfidenceScore(existing.confidence);
    const newScore = this.getConfidenceScore(newValue.confidence);
    
    // If confidence difference is significant, use higher confidence
    if (Math.abs(existingScore - newScore) >= 1) {
      return newScore > existingScore ? 'use_new' : 'keep_existing';
    }
    
    // If both have same confidence, use strategy default
    if (strategy.onDuplicate === 'average') {
      return 'merge_average';
    }
    
    // For significant clinical differences, require manual review
    const percentDiff = Math.abs(existing.normalizedValue - newValue.normalizedValue) / 
                       Math.max(existing.normalizedValue, newValue.normalizedValue);
    
    if (percentDiff > 0.3) { // 30% difference
      return 'manual_review';
    }
    
    return strategy.onDuplicate === 'keep_latest' ? 'use_new' : 'keep_existing';
  }
}
