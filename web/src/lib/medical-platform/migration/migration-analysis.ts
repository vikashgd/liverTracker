/**
 * Migration Analysis System
 * Comprehensive analysis tools for database unit conversion migration
 */

import { PrismaClient } from '@/generated/prisma';
import { enhancedUnitConverter, EnhancedConversionResult } from '../core/enhanced-unit-converter';
import { MEDICAL_PARAMETERS } from '../core/parameters';

export interface MigrationAnalysisResult {
  overview: {
    totalRecords: number;
    recordsNeedingConversion: number;
    conversionRate: number;
    estimatedDuration: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  byMetric: { [metricName: string]: MetricAnalysis };
  byCategory: { [category: string]: CategoryAnalysis };
  qualityAssessment: QualityAssessment;
  recommendations: string[];
  warnings: string[];
  migrationPlan: MigrationPlan;
}

export interface MetricAnalysis {
  metricName: string;
  totalRecords: number;
  needsConversion: number;
  conversionRate: number;
  examples: ConversionExample[];
  unitDistribution: { [unit: string]: number };
  valueRanges: {
    min: number;
    max: number;
    median: number;
    outliers: number;
  };
  qualityIssues: QualityIssue[];
  estimatedBatchTime: number;
}

export interface CategoryAnalysis {
  category: string;
  totalRecords: number;
  needsConversion: number;
  metrics: string[];
  priority: number;
  estimatedDuration: number;
}

export interface ConversionExample {
  recordId: string;
  reportId: string;
  originalValue: number;
  originalUnit: string;
  convertedValue: number;
  convertedUnit: string;
  conversionRule: string;
  confidenceScore: number;
  validationStatus: string;
  createdAt: Date;
}

export interface QualityIssue {
  type: 'missing_unit' | 'suspicious_value' | 'conversion_error' | 'data_inconsistency';
  severity: 'low' | 'medium' | 'high';
  count: number;
  description: string;
  examples: string[];
  recommendation: string;
}

export interface QualityAssessment {
  overallScore: number; // 0-100
  dataCompleteness: number;
  unitConsistency: number;
  valueReasonableness: number;
  conversionConfidence: number;
  issues: QualityIssue[];
  recommendations: string[];
}

export interface MigrationPlan {
  phases: MigrationPhase[];
  totalEstimatedTime: number;
  recommendedBatchSize: number;
  riskMitigation: string[];
  prerequisites: string[];
  rollbackStrategy: string;
}

export interface MigrationPhase {
  phase: number;
  name: string;
  description: string;
  metrics: string[];
  estimatedRecords: number;
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
  dependencies: string[];
}

export class MigrationAnalyzer {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Perform comprehensive migration analysis
   */
  async performComprehensiveAnalysis(): Promise<MigrationAnalysisResult> {
    console.log('🔍 Starting comprehensive migration analysis...');

    const startTime = Date.now();

    // Get all unconverted records
    const unconvertedRecords = await this.prisma.extractedMetric.findMany({
      where: {
        value: { not: null },
        wasConverted: false
      },
      select: {
        id: true,
        reportId: true,
        name: true,
        value: true,
        unit: true,
        createdAt: true,
        category: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalRecords = await this.prisma.extractedMetric.count({
      where: { value: { not: null } }
    });

    console.log(`📊 Analyzing ${unconvertedRecords.length} unconverted records out of ${totalRecords} total`);

    // Analyze by metric
    const byMetric = await this.analyzeByMetric(unconvertedRecords);
    
    // Analyze by category
    const byCategory = await this.analyzeByCategory(unconvertedRecords);
    
    // Perform quality assessment
    const qualityAssessment = await this.performQualityAssessment(unconvertedRecords);
    
    // Generate migration plan
    const migrationPlan = this.generateMigrationPlan(byMetric, byCategory, qualityAssessment);

    // Calculate overview metrics
    const recordsNeedingConversion = Object.values(byMetric)
      .reduce((sum, metric) => sum + metric.needsConversion, 0);
    
    const conversionRate = totalRecords > 0 ? (recordsNeedingConversion / totalRecords) * 100 : 0;
    
    // Determine risk level
    const riskLevel = this.assessOverallRisk(qualityAssessment, conversionRate, recordsNeedingConversion);
    
    // Generate recommendations and warnings
    const { recommendations, warnings } = this.generateRecommendationsAndWarnings(
      qualityAssessment, 
      riskLevel, 
      recordsNeedingConversion
    );

    const analysisTime = Date.now() - startTime;
    console.log(`✅ Analysis complete in ${analysisTime}ms`);

    return {
      overview: {
        totalRecords,
        recordsNeedingConversion,
        conversionRate,
        estimatedDuration: migrationPlan.totalEstimatedTime,
        riskLevel
      },
      byMetric,
      byCategory,
      qualityAssessment,
      recommendations,
      warnings,
      migrationPlan
    };
  }

  /**
   * Analyze records by metric type
   */
  private async analyzeByMetric(records: any[]): Promise<{ [metricName: string]: MetricAnalysis }> {
    const metricGroups = this.groupRecordsByMetric(records);
    const analysis: { [metricName: string]: MetricAnalysis } = {};

    for (const [metricName, metricRecords] of Object.entries(metricGroups)) {
      console.log(`🔬 Analyzing ${metricName}: ${metricRecords.length} records`);

      const examples: ConversionExample[] = [];
      const unitDistribution: { [unit: string]: number } = {};
      const values: number[] = [];
      const qualityIssues: QualityIssue[] = [];
      let needsConversion = 0;

      // Analyze each record
      for (const record of metricRecords.slice(0, 1000)) { // Limit for performance
        // Track unit distribution
        const unit = record.unit || 'unknown';
        unitDistribution[unit] = (unitDistribution[unit] || 0) + 1;
        
        // Track values for range analysis
        if (record.value !== null) {
          values.push(record.value);
        }

        // Test conversion
        try {
          const conversionResult = enhancedUnitConverter.convertForStorage(
            metricName,
            record.value,
            record.unit
          );

          if (conversionResult.wasConverted) {
            needsConversion++;
            
            // Store example if we don't have too many
            if (examples.length < 10) {
              examples.push({
                recordId: record.id,
                reportId: record.reportId,
                originalValue: record.value,
                originalUnit: record.unit || '',
                convertedValue: conversionResult.value,
                convertedUnit: conversionResult.unit,
                conversionRule: conversionResult.conversionRule || 'unknown',
                confidenceScore: conversionResult.confidenceScore,
                validationStatus: conversionResult.validationStatus,
                createdAt: record.createdAt
              });
            }
          }

          // Check for quality issues
          if (conversionResult.validationStatus === 'error') {
            this.addQualityIssue(qualityIssues, 'conversion_error', 'high', 
              `Conversion failed: ${conversionResult.validationNotes}`, record.id);
          } else if (conversionResult.validationStatus === 'suspicious') {
            this.addQualityIssue(qualityIssues, 'suspicious_value', 'medium',
              `Suspicious value detected: ${conversionResult.validationNotes}`, record.id);
          }

        } catch (error) {
          this.addQualityIssue(qualityIssues, 'conversion_error', 'high',
            `Conversion exception: ${error}`, record.id);
        }

        // Check for missing units
        if (!record.unit) {
          this.addQualityIssue(qualityIssues, 'missing_unit', 'medium',
            'Missing unit information', record.id);
        }
      }

      // Calculate statistics
      const conversionRate = metricRecords.length > 0 ? (needsConversion / metricRecords.length) * 100 : 0;
      const valueRanges = this.calculateValueRanges(values);
      const estimatedBatchTime = this.estimateBatchTime(metricRecords.length, needsConversion);

      analysis[metricName] = {
        metricName,
        totalRecords: metricRecords.length,
        needsConversion,
        conversionRate,
        examples,
        unitDistribution,
        valueRanges,
        qualityIssues,
        estimatedBatchTime
      };
    }

    return analysis;
  }

  /**
   * Analyze records by category
   */
  private async analyzeByCategory(records: any[]): Promise<{ [category: string]: CategoryAnalysis }> {
    const categoryGroups: { [category: string]: any[] } = {};
    
    // Group by category
    records.forEach(record => {
      const category = record.category || 'uncategorized';
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(record);
    });

    const analysis: { [category: string]: CategoryAnalysis } = {};

    for (const [category, categoryRecords] of Object.entries(categoryGroups)) {
      const metrics = [...new Set(categoryRecords.map(r => r.name))];
      let needsConversion = 0;

      // Count records needing conversion
      for (const record of categoryRecords) {
        try {
          const conversionResult = enhancedUnitConverter.convertForStorage(
            record.name,
            record.value,
            record.unit
          );
          if (conversionResult.wasConverted) {
            needsConversion++;
          }
        } catch (error) {
          // Count errors as needing attention
          needsConversion++;
        }
      }

      // Determine priority based on category importance
      const priority = this.getCategoryPriority(category);
      const estimatedDuration = this.estimateCategoryDuration(categoryRecords.length, needsConversion);

      analysis[category] = {
        category,
        totalRecords: categoryRecords.length,
        needsConversion,
        metrics,
        priority,
        estimatedDuration
      };
    }

    return analysis;
  }

  /**
   * Perform quality assessment
   */
  private async performQualityAssessment(records: any[]): Promise<QualityAssessment> {
    let dataCompleteness = 0;
    let unitConsistency = 0;
    let valueReasonableness = 0;
    let conversionConfidence = 0;
    const issues: QualityIssue[] = [];

    const sampleSize = Math.min(1000, records.length);
    const sample = records.slice(0, sampleSize);

    let completeRecords = 0;
    let consistentUnits = 0;
    let reasonableValues = 0;
    let highConfidenceConversions = 0;
    let totalConversions = 0;

    for (const record of sample) {
      // Data completeness
      if (record.value !== null && record.name && record.unit) {
        completeRecords++;
      }

      // Unit consistency (check if unit matches expected for parameter)
      const parameter = Object.values(MEDICAL_PARAMETERS).find(p => 
        p.metric.toLowerCase() === record.name.toLowerCase()
      );
      if (parameter && record.unit) {
        const expectedUnits = [
          parameter.units.standard,
          ...parameter.units.alternatives.map((alt: any) => alt.name)
        ];
        if (expectedUnits.some(unit => unit.toLowerCase() === record.unit.toLowerCase())) {
          consistentUnits++;
        }
      }

      // Value reasonableness
      if (parameter && record.value !== null) {
        const { criticalRange } = parameter.clinical;
        if (record.value >= criticalRange.min * 0.01 && record.value <= criticalRange.max * 100) {
          reasonableValues++;
        }
      }

      // Conversion confidence
      try {
        const conversionResult = enhancedUnitConverter.convertForStorage(
          record.name,
          record.value,
          record.unit
        );
        if (conversionResult.wasConverted) {
          totalConversions++;
          if (conversionResult.confidenceScore > 0.8) {
            highConfidenceConversions++;
          }
        }
      } catch (error) {
        // Conversion failed
      }
    }

    // Calculate scores
    dataCompleteness = sampleSize > 0 ? (completeRecords / sampleSize) * 100 : 0;
    unitConsistency = sampleSize > 0 ? (consistentUnits / sampleSize) * 100 : 0;
    valueReasonableness = sampleSize > 0 ? (reasonableValues / sampleSize) * 100 : 0;
    conversionConfidence = totalConversions > 0 ? (highConfidenceConversions / totalConversions) * 100 : 0;

    const overallScore = (dataCompleteness + unitConsistency + valueReasonableness + conversionConfidence) / 4;

    // Generate quality recommendations
    const recommendations: string[] = [];
    if (dataCompleteness < 80) {
      recommendations.push('Improve data completeness - many records missing values or units');
    }
    if (unitConsistency < 70) {
      recommendations.push('Standardize unit formats - many units don\'t match expected formats');
    }
    if (valueReasonableness < 90) {
      recommendations.push('Review outlier values - some values appear unreasonable');
    }
    if (conversionConfidence < 80) {
      recommendations.push('Review conversion rules - low confidence in some conversions');
    }

    return {
      overallScore,
      dataCompleteness,
      unitConsistency,
      valueReasonableness,
      conversionConfidence,
      issues,
      recommendations
    };
  }

  /**
   * Generate migration plan
   */
  private generateMigrationPlan(
    byMetric: { [metricName: string]: MetricAnalysis },
    byCategory: { [category: string]: CategoryAnalysis },
    qualityAssessment: QualityAssessment
  ): MigrationPlan {
    const phases: MigrationPhase[] = [];
    
    // Phase 1: High-priority, low-risk metrics
    const highPriorityMetrics = Object.values(byMetric)
      .filter(m => m.qualityIssues.filter(i => i.severity === 'high').length === 0)
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 5);

    if (highPriorityMetrics.length > 0) {
      phases.push({
        phase: 1,
        name: 'High-Priority Metrics',
        description: 'Convert high-confidence, frequently used metrics first',
        metrics: highPriorityMetrics.map(m => m.metricName),
        estimatedRecords: highPriorityMetrics.reduce((sum, m) => sum + m.needsConversion, 0),
        estimatedDuration: highPriorityMetrics.reduce((sum, m) => sum + m.estimatedBatchTime, 0),
        riskLevel: 'low',
        dependencies: []
      });
    }

    // Phase 2: Remaining standard metrics
    const remainingMetrics = Object.values(byMetric)
      .filter(m => !highPriorityMetrics.includes(m))
      .filter(m => m.qualityIssues.filter(i => i.severity === 'high').length <= 2);

    if (remainingMetrics.length > 0) {
      phases.push({
        phase: 2,
        name: 'Standard Metrics',
        description: 'Convert remaining metrics with good data quality',
        metrics: remainingMetrics.map(m => m.metricName),
        estimatedRecords: remainingMetrics.reduce((sum, m) => sum + m.needsConversion, 0),
        estimatedDuration: remainingMetrics.reduce((sum, m) => sum + m.estimatedBatchTime, 0),
        riskLevel: 'medium',
        dependencies: ['Phase 1 completion']
      });
    }

    // Phase 3: Problematic metrics
    const problematicMetrics = Object.values(byMetric)
      .filter(m => m.qualityIssues.filter(i => i.severity === 'high').length > 2);

    if (problematicMetrics.length > 0) {
      phases.push({
        phase: 3,
        name: 'Problematic Metrics',
        description: 'Convert metrics with data quality issues - requires manual review',
        metrics: problematicMetrics.map(m => m.metricName),
        estimatedRecords: problematicMetrics.reduce((sum, m) => sum + m.needsConversion, 0),
        estimatedDuration: problematicMetrics.reduce((sum, m) => sum + m.estimatedBatchTime * 2, 0), // Double time for manual review
        riskLevel: 'high',
        dependencies: ['Phase 1 and 2 completion', 'Manual data review']
      });
    }

    const totalEstimatedTime = phases.reduce((sum, phase) => sum + phase.estimatedDuration, 0);
    const recommendedBatchSize = this.calculateRecommendedBatchSize(qualityAssessment.overallScore);

    return {
      phases,
      totalEstimatedTime,
      recommendedBatchSize,
      riskMitigation: [
        'Create full database backup before migration',
        'Run dry-run migration first',
        'Implement rollback procedures',
        'Monitor conversion accuracy during migration',
        'Validate sample records after each phase'
      ],
      prerequisites: [
        'Database backup completed',
        'Migration tools tested',
        'Rollback procedures verified',
        'Monitoring systems in place'
      ],
      rollbackStrategy: 'Phase-by-phase rollback using original value preservation'
    };
  }

  // Helper methods
  private groupRecordsByMetric(records: any[]): { [metricName: string]: any[] } {
    const groups: { [metricName: string]: any[] } = {};
    records.forEach(record => {
      if (!groups[record.name]) {
        groups[record.name] = [];
      }
      groups[record.name].push(record);
    });
    return groups;
  }

  private addQualityIssue(
    issues: QualityIssue[],
    type: QualityIssue['type'],
    severity: QualityIssue['severity'],
    description: string,
    recordId: string
  ): void {
    let issue = issues.find(i => i.type === type && i.description === description);
    if (!issue) {
      issue = {
        type,
        severity,
        count: 0,
        description,
        examples: [],
        recommendation: this.getRecommendationForIssue(type)
      };
      issues.push(issue);
    }
    issue.count++;
    if (issue.examples.length < 5) {
      issue.examples.push(recordId);
    }
  }

  private getRecommendationForIssue(type: QualityIssue['type']): string {
    switch (type) {
      case 'missing_unit':
        return 'Review source data extraction to capture unit information';
      case 'suspicious_value':
        return 'Manually review suspicious values before conversion';
      case 'conversion_error':
        return 'Fix conversion rules or exclude problematic records';
      case 'data_inconsistency':
        return 'Standardize data format and validation rules';
      default:
        return 'Manual review recommended';
    }
  }

  private calculateValueRanges(values: number[]): MetricAnalysis['valueRanges'] {
    if (values.length === 0) {
      return { min: 0, max: 0, median: 0, outliers: 0 };
    }

    const sorted = values.sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // Simple outlier detection (values beyond 3 standard deviations)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    const outliers = values.filter(val => Math.abs(val - mean) > 3 * stdDev).length;

    return { min, max, median, outliers };
  }

  private estimateBatchTime(totalRecords: number, needsConversion: number): number {
    // Estimate based on 100 records per second processing
    const processingTime = totalRecords / 100;
    // Add extra time for conversions (more complex processing)
    const conversionTime = needsConversion / 50;
    return Math.ceil(processingTime + conversionTime);
  }

  private getCategoryPriority(category: string): number {
    const priorities: { [category: string]: number } = {
      'liver_function': 1,
      'kidney_function': 2,
      'hematology': 3,
      'chemistry': 4,
      'imaging': 5,
      'uncategorized': 10
    };
    return priorities[category] || 5;
  }

  private estimateCategoryDuration(totalRecords: number, needsConversion: number): number {
    return this.estimateBatchTime(totalRecords, needsConversion);
  }

  private assessOverallRisk(
    qualityAssessment: QualityAssessment,
    conversionRate: number,
    recordsNeedingConversion: number
  ): 'low' | 'medium' | 'high' {
    if (qualityAssessment.overallScore < 60 || recordsNeedingConversion > 50000) {
      return 'high';
    }
    if (qualityAssessment.overallScore < 80 || conversionRate > 50) {
      return 'medium';
    }
    return 'low';
  }

  private generateRecommendationsAndWarnings(
    qualityAssessment: QualityAssessment,
    riskLevel: 'low' | 'medium' | 'high',
    recordsNeedingConversion: number
  ): { recommendations: string[]; warnings: string[] } {
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Risk-based recommendations
    if (riskLevel === 'high') {
      recommendations.push('Consider manual review of problematic records before migration');
      recommendations.push('Implement additional validation checks');
      warnings.push('High-risk migration detected - proceed with caution');
    }

    // Volume-based recommendations
    if (recordsNeedingConversion > 10000) {
      recommendations.push('Use smaller batch sizes for large dataset migration');
      recommendations.push('Plan for extended migration time');
    }

    // Quality-based recommendations
    recommendations.push(...qualityAssessment.recommendations);

    if (qualityAssessment.overallScore < 70) {
      warnings.push('Data quality issues detected - review before proceeding');
    }

    return { recommendations, warnings };
  }

  private calculateRecommendedBatchSize(qualityScore: number): number {
    if (qualityScore > 90) return 200;
    if (qualityScore > 80) return 150;
    if (qualityScore > 70) return 100;
    return 50; // Smaller batches for lower quality data
  }
}