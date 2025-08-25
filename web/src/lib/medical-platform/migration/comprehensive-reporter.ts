/**
 * Comprehensive Migration Reporting System
 * Unified reporting for analysis, execution, validation, and monitoring
 */

import type { MigrationAnalysisResult } from './migration-analysis';
import type { ExecutionSummary } from './batch-executor';
import type { ValidationResult } from './migration-validator';
import type { MonitoringReport } from './migration-monitor';

export interface ComprehensiveMigrationReport {
  metadata: {
    reportId: string;
    generatedAt: Date;
    reportType: 'pre_migration' | 'post_migration' | 'complete_cycle';
    migrationPhase: string;
    version: string;
  };
  executiveSummary: ExecutiveSummary;
  analysis?: MigrationAnalysisResult;
  execution?: ExecutionSummary;
  validation?: ValidationResult;
  monitoring?: MonitoringReport[];
  recommendations: RecommendationSet;
  actionItems: ActionItem[];
  appendices: {
    detailedMetrics: any;
    errorLogs: any;
    performanceCharts: any;
    auditTrail: any;
  };
}

export interface ExecutiveSummary {
  overallStatus: 'success' | 'partial_success' | 'failure' | 'requires_attention';
  keyMetrics: {
    recordsProcessed: number;
    recordsConverted: number;
    successRate: number;
    dataQualityScore: number;
    performanceImpact: string;
  };
  criticalFindings: string[];
  businessImpact: string;
  nextSteps: string[];
}

export interface RecommendationSet {
  immediate: Recommendation[];
  shortTerm: Recommendation[];
  longTerm: Recommendation[];
  preventive: Recommendation[];
}

export interface Recommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'data_quality' | 'performance' | 'process' | 'monitoring';
  title: string;
  description: string;
  rationale: string;
  estimatedEffort: string;
  expectedBenefit: string;
  dependencies: string[];
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  assignee: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  dependencies: string[];
  estimatedHours: number;
}

export class ComprehensiveReporter {
  /**
   * Generate complete migration report
   */
  static generateComprehensiveReport(
    analysis?: MigrationAnalysisResult,
    execution?: ExecutionSummary,
    validation?: ValidationResult,
    monitoring?: MonitoringReport[]
  ): ComprehensiveMigrationReport {
    const reportId = `migration_report_${Date.now()}`;
    const reportType = this.determineReportType(analysis, execution, validation);
    
    console.log(`📊 Generating comprehensive migration report: ${reportId}`);

    const executiveSummary = this.generateExecutiveSummary(analysis, execution, validation);
    const recommendations = this.generateRecommendations(analysis, execution, validation);
    const actionItems = this.generateActionItems(recommendations, validation);

    return {
      metadata: {
        reportId,
        generatedAt: new Date(),
        reportType,
        migrationPhase: this.determineMigrationPhase(analysis, execution, validation),
        version: '1.0.0'
      },
      executiveSummary,
      analysis,
      execution,
      validation,
      monitoring,
      recommendations,
      actionItems,
      appendices: {
        detailedMetrics: this.generateDetailedMetrics(analysis, execution, validation),
        errorLogs: this.generateErrorLogs(execution, validation),
        performanceCharts: this.generatePerformanceCharts(execution, monitoring),
        auditTrail: this.generateAuditTrail(execution, validation)
      }
    };
  }

  /**
   * Generate executive summary
   */
  private static generateExecutiveSummary(
    analysis?: MigrationAnalysisResult,
    execution?: ExecutionSummary,
    validation?: ValidationResult
  ): ExecutiveSummary {
    let overallStatus: ExecutiveSummary['overallStatus'] = 'success';
    const criticalFindings: string[] = [];
    let businessImpact = '';
    const nextSteps: string[] = [];

    // Determine overall status
    if (validation && !validation.overall.passed) {
      overallStatus = 'failure';
      criticalFindings.push('Migration validation failed');
    } else if (execution && execution.failedBatches > 0) {
      overallStatus = 'partial_success';
      criticalFindings.push(`${execution.failedBatches} batches failed during execution`);
    } else if (validation && validation.overall.score < 80) {
      overallStatus = 'requires_attention';
      criticalFindings.push('Data quality score below acceptable threshold');
    }

    // Key metrics
    const keyMetrics = {
      recordsProcessed: execution?.totalRecordsProcessed || analysis?.overview.recordsNeedingConversion || 0,
      recordsConverted: execution?.totalRecordsConverted || 0,
      successRate: execution ? (execution.totalRecordsConverted / execution.totalRecordsProcessed) * 100 : 0,
      dataQualityScore: validation?.overall.score || analysis?.qualityAssessment.overallScore || 0,
      performanceImpact: validation?.performanceImpact.queryPerformance.improvement 
        ? `${validation.performanceImpact.queryPerformance.improvement}% improvement`
        : 'Not measured'
    };

    // Business impact assessment
    if (overallStatus === 'success') {
      businessImpact = `Migration successfully converted ${keyMetrics.recordsConverted.toLocaleString()} records with ${keyMetrics.successRate.toFixed(1)}% success rate. Data is now standardized and ready for consistent analysis.`;
    } else if (overallStatus === 'partial_success') {
      businessImpact = `Migration partially successful with ${keyMetrics.successRate.toFixed(1)}% success rate. ${keyMetrics.recordsConverted.toLocaleString()} records converted successfully, but ${execution?.totalRecordsErrored || 0} records require attention.`;
    } else {
      businessImpact = 'Migration encountered significant issues that require immediate attention before the system can be considered production-ready.';
    }

    // Next steps
    if (overallStatus === 'success') {
      nextSteps.push('Monitor system performance and data quality');
      nextSteps.push('Update application code to use standardized data');
      nextSteps.push('Schedule regular data quality assessments');
    } else {
      nextSteps.push('Review and address critical issues identified');
      nextSteps.push('Consider rollback if issues cannot be resolved quickly');
      nextSteps.push('Implement additional data validation before retry');
    }

    // Critical findings from validation
    if (validation?.criticalIssues.length) {
      validation.criticalIssues.forEach(issue => {
        criticalFindings.push(issue.message);
      });
    }

    return {
      overallStatus,
      keyMetrics,
      criticalFindings,
      businessImpact,
      nextSteps
    };
  }

  /**
   * Generate comprehensive recommendations
   */
  private static generateRecommendations(
    analysis?: MigrationAnalysisResult,
    execution?: ExecutionSummary,
    validation?: ValidationResult
  ): RecommendationSet {
    const immediate: Recommendation[] = [];
    const shortTerm: Recommendation[] = [];
    const longTerm: Recommendation[] = [];
    const preventive: Recommendation[] = [];

    // Immediate recommendations (critical issues)
    if (validation?.criticalIssues.length) {
      immediate.push({
        id: 'fix_critical_issues',
        priority: 'critical',
        category: 'data_quality',
        title: 'Address Critical Data Issues',
        description: 'Resolve critical data integrity and validation issues identified during migration',
        rationale: 'Critical issues can compromise data accuracy and system reliability',
        estimatedEffort: '2-4 hours',
        expectedBenefit: 'Ensures data integrity and system stability',
        dependencies: []
      });
    }

    if (execution && execution.performanceMetrics.errorRate > 10) {
      immediate.push({
        id: 'investigate_high_error_rate',
        priority: 'critical',
        category: 'data_quality',
        title: 'Investigate High Error Rate',
        description: `Error rate of ${execution.performanceMetrics.errorRate.toFixed(1)}% exceeds acceptable threshold`,
        rationale: 'High error rates indicate systematic issues that need immediate attention',
        estimatedEffort: '4-8 hours',
        expectedBenefit: 'Reduces data loss and improves migration reliability',
        dependencies: []
      });
    }

    // Short-term recommendations (1-2 weeks)
    if (validation && validation.conversionAccuracy.overallAccuracy < 95) {
      shortTerm.push({
        id: 'improve_conversion_accuracy',
        priority: 'high',
        category: 'data_quality',
        title: 'Improve Conversion Accuracy',
        description: 'Review and refine conversion rules to achieve >95% accuracy',
        rationale: 'Higher accuracy ensures more reliable medical data for clinical decisions',
        estimatedEffort: '1-2 weeks',
        expectedBenefit: 'Improved data quality and clinical reliability',
        dependencies: ['fix_critical_issues']
      });
    }

    if (analysis && analysis.qualityAssessment.overallScore < 80) {
      shortTerm.push({
        id: 'enhance_data_quality',
        priority: 'high',
        category: 'data_quality',
        title: 'Enhance Source Data Quality',
        description: 'Implement data quality improvements at the source to prevent future issues',
        rationale: 'Better source data quality reduces conversion errors and improves outcomes',
        estimatedEffort: '2-3 weeks',
        expectedBenefit: 'Reduced future migration issues and better data consistency',
        dependencies: []
      });
    }

    // Long-term recommendations (1-3 months)
    longTerm.push({
      id: 'implement_continuous_monitoring',
      priority: 'medium',
      category: 'monitoring',
      title: 'Implement Continuous Data Quality Monitoring',
      description: 'Set up automated monitoring for data quality and conversion accuracy',
      rationale: 'Proactive monitoring prevents issues and ensures ongoing data quality',
      estimatedEffort: '3-4 weeks',
      expectedBenefit: 'Early detection of data quality issues and automated alerting',
      dependencies: ['improve_conversion_accuracy']
    });

    longTerm.push({
      id: 'optimize_performance',
      priority: 'medium',
      category: 'performance',
      title: 'Optimize Migration Performance',
      description: 'Implement performance optimizations for future migrations',
      rationale: 'Better performance reduces migration time and resource usage',
      estimatedEffort: '2-3 weeks',
      expectedBenefit: 'Faster migrations and reduced system load',
      dependencies: []
    });

    // Preventive recommendations
    preventive.push({
      id: 'establish_data_governance',
      priority: 'medium',
      category: 'process',
      title: 'Establish Data Governance Framework',
      description: 'Create policies and procedures for data quality and migration processes',
      rationale: 'Structured governance prevents future data quality issues',
      estimatedEffort: '4-6 weeks',
      expectedBenefit: 'Consistent data quality and standardized processes',
      dependencies: []
    });

    preventive.push({
      id: 'create_testing_framework',
      priority: 'medium',
      category: 'process',
      title: 'Create Comprehensive Testing Framework',
      description: 'Develop automated testing for future migrations and data changes',
      rationale: 'Automated testing catches issues before they affect production',
      estimatedEffort: '3-4 weeks',
      expectedBenefit: 'Reduced risk of migration failures and faster deployment',
      dependencies: ['establish_data_governance']
    });

    return {
      immediate,
      shortTerm,
      longTerm,
      preventive
    };
  }

  /**
   * Generate action items from recommendations
   */
  private static generateActionItems(
    recommendations: RecommendationSet,
    validation?: ValidationResult
  ): ActionItem[] {
    const actionItems: ActionItem[] = [];
    let itemCounter = 1;

    // Convert immediate recommendations to urgent action items
    recommendations.immediate.forEach(rec => {
      actionItems.push({
        id: `action_${itemCounter++}`,
        title: rec.title,
        description: rec.description,
        priority: 'urgent',
        assignee: 'Data Engineering Team',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        status: 'pending',
        dependencies: rec.dependencies,
        estimatedHours: this.parseEstimatedHours(rec.estimatedEffort)
      });
    });

    // Convert high-priority short-term recommendations
    recommendations.shortTerm
      .filter(rec => rec.priority === 'high')
      .forEach(rec => {
        actionItems.push({
          id: `action_${itemCounter++}`,
          title: rec.title,
          description: rec.description,
          priority: 'high',
          assignee: 'Data Engineering Team',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
          status: 'pending',
          dependencies: rec.dependencies,
          estimatedHours: this.parseEstimatedHours(rec.estimatedEffort)
        });
      });

    // Add specific action items for validation issues
    if (validation?.warnings.length) {
      validation.warnings.slice(0, 3).forEach(warning => {
        actionItems.push({
          id: `action_${itemCounter++}`,
          title: `Resolve: ${warning.message}`,
          description: warning.recommendation,
          priority: warning.severity === 'high' ? 'high' : 'medium',
          assignee: 'Data Quality Team',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          status: 'pending',
          dependencies: [],
          estimatedHours: warning.autoFixable ? 2 : 8
        });
      });
    }

    return actionItems;
  }

  // Helper methods for generating appendices
  private static generateDetailedMetrics(
    analysis?: MigrationAnalysisResult,
    execution?: ExecutionSummary,
    validation?: ValidationResult
  ): any {
    return {
      analysisMetrics: analysis ? {
        totalRecords: analysis.overview.totalRecords,
        conversionRate: analysis.overview.conversionRate,
        qualityScore: analysis.qualityAssessment.overallScore,
        riskLevel: analysis.overview.riskLevel
      } : null,
      executionMetrics: execution ? {
        totalBatches: execution.totalBatches,
        successfulBatches: execution.successfulBatches,
        averageThroughput: execution.averageThroughput,
        errorRate: execution.performanceMetrics.errorRate
      } : null,
      validationMetrics: validation ? {
        overallScore: validation.overall.score,
        dataIntegrity: validation.dataIntegrity.passed,
        conversionAccuracy: validation.conversionAccuracy.overallAccuracy,
        clinicalCompliance: validation.clinicalValidation.overallCompliance
      } : null
    };
  }

  private static generateErrorLogs(
    execution?: ExecutionSummary,
    validation?: ValidationResult
  ): any {
    const errors: any[] = [];

    if (execution?.errors.length) {
      errors.push(...execution.errors.map(error => ({
        source: 'execution',
        timestamp: error.timestamp,
        severity: error.severity,
        message: error.error,
        recordId: error.recordId,
        metricName: error.metricName
      })));
    }

    if (validation?.criticalIssues.length) {
      errors.push(...validation.criticalIssues.map(issue => ({
        source: 'validation',
        timestamp: new Date(),
        severity: issue.severity,
        message: issue.message,
        type: issue.type,
        affectedRecords: issue.affectedRecords.length
      })));
    }

    return {
      totalErrors: errors.length,
      errorsBySeverity: errors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }),
      recentErrors: errors.slice(-20) // Last 20 errors
    };
  }

  private static generatePerformanceCharts(
    execution?: ExecutionSummary,
    monitoring?: MonitoringReport[]
  ): any {
    return {
      throughputOverTime: monitoring?.map(report => ({
        timestamp: report.timestamp,
        throughput: report.averageThroughput
      })) || [],
      batchPerformance: execution ? {
        fastestBatch: execution.performanceMetrics.fastestBatch,
        slowestBatch: execution.performanceMetrics.slowestBatch,
        averageBatchTime: execution.performanceMetrics.averageBatchTime
      } : null,
      resourceUsage: monitoring?.map(report => ({
        timestamp: report.timestamp,
        memoryUsage: report.performanceMetrics.memoryUsage.percentage,
        cpuUsage: report.performanceMetrics.cpuUsage
      })) || []
    };
  }

  private static generateAuditTrail(
    execution?: ExecutionSummary,
    validation?: ValidationResult
  ): any {
    const auditEvents: any[] = [];

    if (execution) {
      auditEvents.push({
        timestamp: new Date(),
        event: 'migration_execution_completed',
        details: {
          totalRecords: execution.totalRecordsProcessed,
          successRate: (execution.totalRecordsConverted / execution.totalRecordsProcessed) * 100,
          duration: execution.totalDuration
        }
      });
    }

    if (validation) {
      auditEvents.push({
        timestamp: new Date(),
        event: 'migration_validation_completed',
        details: {
          overallScore: validation.overall.score,
          passed: validation.overall.passed,
          criticalIssues: validation.criticalIssues.length
        }
      });
    }

    return {
      events: auditEvents,
      totalEvents: auditEvents.length
    };
  }

  // Utility methods
  private static determineReportType(
    analysis?: MigrationAnalysisResult,
    execution?: ExecutionSummary,
    validation?: ValidationResult
  ): ComprehensiveMigrationReport['metadata']['reportType'] {
    if (analysis && execution && validation) return 'complete_cycle';
    if (execution || validation) return 'post_migration';
    return 'pre_migration';
  }

  private static determineMigrationPhase(
    analysis?: MigrationAnalysisResult,
    execution?: ExecutionSummary,
    validation?: ValidationResult
  ): string {
    if (validation) return 'validation_complete';
    if (execution) return 'execution_complete';
    if (analysis) return 'analysis_complete';
    return 'planning';
  }

  private static parseEstimatedHours(effort: string): number {
    const match = effort.match(/(\d+)-?(\d+)?\s*(hours?|weeks?)/i);
    if (!match) return 8; // Default 8 hours
    
    const min = parseInt(match[1]);
    const max = match[2] ? parseInt(match[2]) : min;
    const unit = match[3].toLowerCase();
    
    const hours = unit.includes('week') ? (min + max) / 2 * 40 : (min + max) / 2;
    return Math.round(hours);
  }
}

/**
 * Utility function to generate comprehensive report
 */
export function generateComprehensiveReport(
  analysis?: MigrationAnalysisResult,
  execution?: ExecutionSummary,
  validation?: ValidationResult,
  monitoring?: MonitoringReport[]
): ComprehensiveMigrationReport {
  return ComprehensiveReporter.generateComprehensiveReport(analysis, execution, validation, monitoring);
}