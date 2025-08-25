/**
 * Migration Reporting System
 * Comprehensive reporting and visualization for migration analysis
 */

import type { 
  MigrationAnalysisResult, 
  MetricAnalysis, 
  QualityAssessment,
  MigrationPlan 
} from './migration-analysis';

export interface ReportOptions {
  format: 'markdown' | 'html' | 'json' | 'csv';
  includeExamples: boolean;
  includeCharts: boolean;
  detailLevel: 'summary' | 'detailed' | 'comprehensive';
}

export class MigrationReporter {
  /**
   * Generate comprehensive migration report
   */
  static generateReport(
    analysis: MigrationAnalysisResult,
    options: ReportOptions = {
      format: 'markdown',
      includeExamples: true,
      includeCharts: false,
      detailLevel: 'detailed'
    }
  ): string {
    switch (options.format) {
      case 'markdown':
        return this.generateMarkdownReport(analysis, options);
      case 'html':
        return this.generateHTMLReport(analysis, options);
      case 'json':
        return JSON.stringify(analysis, null, 2);
      case 'csv':
        return this.generateCSVReport(analysis);
      default:
        return this.generateMarkdownReport(analysis, options);
    }
  }

  /**
   * Generate markdown report
   */
  private static generateMarkdownReport(
    analysis: MigrationAnalysisResult,
    options: ReportOptions
  ): string {
    let report = '';

    // Header
    report += '# Database Unit Conversion Migration Analysis\\n\\n';
    report += `**Generated**: ${new Date().toISOString()}\\n`;
    report += `**Analysis Duration**: ${analysis.overview.estimatedDuration} seconds\\n\\n`;

    // Executive Summary
    report += '## 📊 Executive Summary\\n\\n';
    report += this.generateExecutiveSummary(analysis);

    // Overview
    report += '## 🔍 Overview\\n\\n';
    report += this.generateOverviewSection(analysis.overview);

    // Quality Assessment
    report += '## 🎯 Data Quality Assessment\\n\\n';
    report += this.generateQualitySection(analysis.qualityAssessment);

    // Detailed Analysis by Metric
    if (options.detailLevel !== 'summary') {
      report += '## 📈 Analysis by Metric\\n\\n';
      report += this.generateMetricAnalysisSection(analysis.byMetric, options);
    }

    // Category Analysis
    report += '## 📂 Analysis by Category\\n\\n';
    report += this.generateCategorySection(analysis.byCategory);

    // Migration Plan
    report += '## 🚀 Migration Plan\\n\\n';
    report += this.generateMigrationPlanSection(analysis.migrationPlan);

    // Recommendations
    report += '## 💡 Recommendations\\n\\n';
    report += this.generateRecommendationsSection(analysis.recommendations);

    // Warnings
    if (analysis.warnings.length > 0) {
      report += '## ⚠️ Warnings\\n\\n';
      report += this.generateWarningsSection(analysis.warnings);
    }

    // Next Steps
    report += '## 🎯 Next Steps\\n\\n';
    report += this.generateNextStepsSection(analysis);

    return report;
  }

  private static generateExecutiveSummary(analysis: MigrationAnalysisResult): string {
    const { overview, qualityAssessment } = analysis;
    
    let summary = '';
    summary += `**Migration Scope**: ${overview.recordsNeedingConversion.toLocaleString()} of ${overview.totalRecords.toLocaleString()} records (${overview.conversionRate.toFixed(1)}%)\\n\\n`;
    summary += `**Risk Level**: ${this.getRiskEmoji(overview.riskLevel)} ${overview.riskLevel.toUpperCase()}\\n\\n`;
    summary += `**Data Quality Score**: ${qualityAssessment.overallScore.toFixed(1)}/100\\n\\n`;
    summary += `**Estimated Duration**: ${Math.ceil(overview.estimatedDuration / 60)} minutes\\n\\n`;

    // Key insights
    summary += '### Key Insights\\n\\n';
    
    if (overview.conversionRate > 80) {
      summary += '- 🔴 **High conversion rate** - Most data needs conversion\\n';
    } else if (overview.conversionRate > 50) {
      summary += '- 🟡 **Moderate conversion rate** - Significant portion needs conversion\\n';
    } else {
      summary += '- 🟢 **Low conversion rate** - Most data already in standard format\\n';
    }

    if (qualityAssessment.overallScore > 80) {
      summary += '- ✅ **Good data quality** - Migration should proceed smoothly\\n';
    } else if (qualityAssessment.overallScore > 60) {
      summary += '- ⚠️ **Moderate data quality** - Some issues need attention\\n';
    } else {
      summary += '- ❌ **Poor data quality** - Significant cleanup required\\n';
    }

    if (overview.riskLevel === 'high') {
      summary += '- 🚨 **High risk migration** - Requires careful planning and validation\\n';
    }

    summary += '\\n';
    return summary;
  }

  private static generateOverviewSection(overview: MigrationAnalysisResult['overview']): string {
    let section = '';
    
    section += '| Metric | Value |\\n';
    section += '|--------|-------|\\n';
    section += `| Total Records | ${overview.totalRecords.toLocaleString()} |\\n`;
    section += `| Records Needing Conversion | ${overview.recordsNeedingConversion.toLocaleString()} |\\n`;
    section += `| Conversion Rate | ${overview.conversionRate.toFixed(1)}% |\\n`;
    section += `| Estimated Duration | ${Math.ceil(overview.estimatedDuration / 60)} minutes |\\n`;
    section += `| Risk Level | ${this.getRiskEmoji(overview.riskLevel)} ${overview.riskLevel.toUpperCase()} |\\n\\n`;

    return section;
  }

  private static generateQualitySection(quality: QualityAssessment): string {
    let section = '';
    
    section += `**Overall Quality Score**: ${quality.overallScore.toFixed(1)}/100\\n\\n`;
    
    section += '### Quality Metrics\\n\\n';
    section += '| Metric | Score | Status |\\n';
    section += '|--------|-------|--------|\\n';
    section += `| Data Completeness | ${quality.dataCompleteness.toFixed(1)}% | ${this.getScoreStatus(quality.dataCompleteness)} |\\n`;
    section += `| Unit Consistency | ${quality.unitConsistency.toFixed(1)}% | ${this.getScoreStatus(quality.unitConsistency)} |\\n`;
    section += `| Value Reasonableness | ${quality.valueReasonableness.toFixed(1)}% | ${this.getScoreStatus(quality.valueReasonableness)} |\\n`;
    section += `| Conversion Confidence | ${quality.conversionConfidence.toFixed(1)}% | ${this.getScoreStatus(quality.conversionConfidence)} |\\n\\n`;

    if (quality.issues.length > 0) {
      section += '### Quality Issues\\n\\n';
      quality.issues.forEach(issue => {
        const severityEmoji = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
        section += `${severityEmoji} **${issue.type.replace(/_/g, ' ').toUpperCase()}** (${issue.count} occurrences)\\n`;
        section += `   - ${issue.description}\\n`;
        section += `   - *Recommendation*: ${issue.recommendation}\\n\\n`;
      });
    }

    return section;
  }

  private static generateMetricAnalysisSection(
    byMetric: { [metricName: string]: MetricAnalysis },
    options: ReportOptions
  ): string {
    let section = '';
    
    // Summary table
    section += '### Summary by Metric\\n\\n';
    section += '| Metric | Total Records | Need Conversion | Conversion Rate | Quality Issues |\\n';
    section += '|--------|---------------|-----------------|-----------------|----------------|\\n';
    
    Object.values(byMetric)
      .sort((a, b) => b.needsConversion - a.needsConversion)
      .forEach(metric => {
        const highIssues = metric.qualityIssues.filter(i => i.severity === 'high').length;
        const issueIndicator = highIssues > 0 ? `🔴 ${highIssues}` : '✅ 0';
        
        section += `| ${metric.metricName} | ${metric.totalRecords.toLocaleString()} | ${metric.needsConversion.toLocaleString()} | ${metric.conversionRate.toFixed(1)}% | ${issueIndicator} |\\n`;
      });
    
    section += '\\n';

    // Detailed analysis for top metrics
    if (options.detailLevel === 'comprehensive') {
      section += '### Detailed Metric Analysis\\n\\n';
      
      Object.values(byMetric)
        .sort((a, b) => b.needsConversion - a.needsConversion)
        .slice(0, 10) // Top 10 metrics
        .forEach(metric => {
          section += `#### ${metric.metricName}\\n\\n`;
          section += `- **Total Records**: ${metric.totalRecords.toLocaleString()}\\n`;
          section += `- **Need Conversion**: ${metric.needsConversion.toLocaleString()} (${metric.conversionRate.toFixed(1)}%)\\n`;
          section += `- **Estimated Processing Time**: ${metric.estimatedBatchTime} seconds\\n\\n`;

          // Unit distribution
          if (Object.keys(metric.unitDistribution).length > 0) {
            section += '**Unit Distribution**:\\n';
            Object.entries(metric.unitDistribution)
              .sort(([,a], [,b]) => b - a)
              .forEach(([unit, count]) => {
                section += `- ${unit || 'unknown'}: ${count} records\\n`;
              });
            section += '\\n';
          }

          // Value ranges
          section += '**Value Ranges**:\\n';
          section += `- Min: ${metric.valueRanges.min}\\n`;
          section += `- Max: ${metric.valueRanges.max}\\n`;
          section += `- Median: ${metric.valueRanges.median}\\n`;
          section += `- Outliers: ${metric.valueRanges.outliers}\\n\\n`;

          // Examples
          if (options.includeExamples && metric.examples.length > 0) {
            section += '**Conversion Examples**:\\n';
            metric.examples.slice(0, 3).forEach(example => {
              section += `- ${example.originalValue} ${example.originalUnit} → ${example.convertedValue} ${example.convertedUnit} (${example.conversionRule})\\n`;
            });
            section += '\\n';
          }

          // Quality issues
          if (metric.qualityIssues.length > 0) {
            section += '**Quality Issues**:\\n';
            metric.qualityIssues.forEach(issue => {
              const severityEmoji = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
              section += `${severityEmoji} ${issue.description} (${issue.count} occurrences)\\n`;
            });
            section += '\\n';
          }

          section += '---\\n\\n';
        });
    }

    return section;
  }

  private static generateCategorySection(byCategory: { [category: string]: any }): string {
    let section = '';
    
    section += '| Category | Records | Need Conversion | Priority | Est. Duration |\\n';
    section += '|----------|---------|-----------------|----------|---------------|\\n';
    
    Object.values(byCategory)
      .sort((a: any, b: any) => a.priority - b.priority)
      .forEach((category: any) => {
        const priorityEmoji = category.priority <= 2 ? '🔴' : category.priority <= 4 ? '🟡' : '🟢';
        section += `| ${category.category} | ${category.totalRecords.toLocaleString()} | ${category.needsConversion.toLocaleString()} | ${priorityEmoji} ${category.priority} | ${category.estimatedDuration}s |\\n`;
      });
    
    section += '\\n';
    return section;
  }

  private static generateMigrationPlanSection(plan: MigrationPlan): string {
    let section = '';
    
    section += `**Total Estimated Time**: ${Math.ceil(plan.totalEstimatedTime / 60)} minutes\\n`;
    section += `**Recommended Batch Size**: ${plan.recommendedBatchSize} records\\n\\n`;

    section += '### Migration Phases\\n\\n';
    plan.phases.forEach(phase => {
      const riskEmoji = this.getRiskEmoji(phase.riskLevel);
      section += `#### Phase ${phase.phase}: ${phase.name}\\n\\n`;
      section += `${riskEmoji} **Risk Level**: ${phase.riskLevel.toUpperCase()}\\n\\n`;
      section += `**Description**: ${phase.description}\\n\\n`;
      section += `**Metrics**: ${phase.metrics.join(', ')}\\n\\n`;
      section += `**Estimated Records**: ${phase.estimatedRecords.toLocaleString()}\\n\\n`;
      section += `**Estimated Duration**: ${Math.ceil(phase.estimatedDuration / 60)} minutes\\n\\n`;
      
      if (phase.dependencies.length > 0) {
        section += `**Dependencies**: ${phase.dependencies.join(', ')}\\n\\n`;
      }
      
      section += '---\\n\\n';
    });

    section += '### Risk Mitigation\\n\\n';
    plan.riskMitigation.forEach(item => {
      section += `- ${item}\\n`;
    });
    section += '\\n';

    section += '### Prerequisites\\n\\n';
    plan.prerequisites.forEach(item => {
      section += `- ${item}\\n`;
    });
    section += '\\n';

    return section;
  }

  private static generateRecommendationsSection(recommendations: string[]): string {
    let section = '';
    recommendations.forEach((rec, index) => {
      section += `${index + 1}. ${rec}\\n`;
    });
    section += '\\n';
    return section;
  }

  private static generateWarningsSection(warnings: string[]): string {
    let section = '';
    warnings.forEach(warning => {
      section += `⚠️ ${warning}\\n\\n`;
    });
    return section;
  }

  private static generateNextStepsSection(analysis: MigrationAnalysisResult): string {
    let section = '';
    
    section += '1. **Review this analysis** - Understand the scope and risks\\n';
    section += '2. **Address quality issues** - Fix data quality problems identified\\n';
    section += '3. **Create database backup** - Full backup before migration\\n';
    section += '4. **Run dry-run migration** - Test with sample data first\\n';
    section += '5. **Execute migration plan** - Follow the phased approach\\n';
    section += '6. **Validate results** - Verify conversion accuracy\\n\\n';

    section += '### Commands to Execute\\n\\n';
    section += '```bash\\n';
    section += '# Run dry-run migration\\n';
    section += 'npm run migrate:dry-run\\n\\n';
    section += '# Execute actual migration\\n';
    section += 'npm run migrate:execute\\n\\n';
    section += '# Validate results\\n';
    section += 'npm run migrate:validate\\n';
    section += '```\\n\\n';

    return section;
  }

  /**
   * Generate HTML report
   */
  private static generateHTMLReport(
    analysis: MigrationAnalysisResult,
    options: ReportOptions
  ): string {
    // Convert markdown to HTML (simplified)
    const markdown = this.generateMarkdownReport(analysis, options);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Migration Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .risk-high { color: #d32f2f; }
        .risk-medium { color: #f57c00; }
        .risk-low { color: #388e3c; }
        .quality-good { color: #388e3c; }
        .quality-fair { color: #f57c00; }
        .quality-poor { color: #d32f2f; }
    </style>
</head>
<body>
    <pre>${markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
  }

  /**
   * Generate CSV report
   */
  private static generateCSVReport(analysis: MigrationAnalysisResult): string {
    let csv = 'Metric,Total Records,Need Conversion,Conversion Rate,Quality Score\\n';
    
    Object.values(analysis.byMetric).forEach(metric => {
      const qualityScore = metric.qualityIssues.length === 0 ? 100 : 
        Math.max(0, 100 - (metric.qualityIssues.length * 10));
      
      csv += `"${metric.metricName}",${metric.totalRecords},${metric.needsConversion},${metric.conversionRate.toFixed(1)},${qualityScore}\\n`;
    });
    
    return csv;
  }

  // Helper methods
  private static getRiskEmoji(riskLevel: string): string {
    switch (riskLevel) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  private static getScoreStatus(score: number): string {
    if (score >= 80) return '✅ Good';
    if (score >= 60) return '⚠️ Fair';
    return '❌ Poor';
  }
}

/**
 * Utility function to generate migration report
 */
export function generateMigrationReport(
  analysis: MigrationAnalysisResult,
  options?: Partial<ReportOptions>
): string {
  const defaultOptions: ReportOptions = {
    format: 'markdown',
    includeExamples: true,
    includeCharts: false,
    detailLevel: 'detailed'
  };
  
  return MigrationReporter.generateReport(analysis, { ...defaultOptions, ...options });
}