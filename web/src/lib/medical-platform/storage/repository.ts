/**
 * DATA REPOSITORY LAYER
 * Enterprise-grade data storage and retrieval for medical platform
 * Handles all database operations with proper error handling and audit trails
 */

import { prisma } from '@/lib/db';
import type {
  MedicalValue,
  MedicalReport,
  ChartSeries,
  ChartDataPoint,
  MetricName,
  PlatformConfig
} from '../core/types';
import { MEDICAL_PARAMETERS } from '../core/parameters';

/**
 * Medical Data Repository
 * Centralized data access layer with enterprise-grade features
 */
export class DataRepository {
  private config: PlatformConfig;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  // ================================
  // REPORT OPERATIONS
  // ================================

  /**
   * Save a complete medical report with all values
   */
  async saveReport(report: MedicalReport): Promise<string> {
    try {
      const transaction = await prisma.$transaction(async (tx: any) => {
        // Create the report file record
        const reportFile = await tx.reportFile.create({
          data: {
            id: report.id,
            userId: report.userId,
            reportType: report.metadata.type,
            reportDate: report.metadata.date,
            objectKey: '', // Will be updated if needed
            summary: JSON.stringify({
              quality: report.quality,
              processing: report.processing,
              valueCount: report.values.size
            }),
            createdAt: new Date()
          }
        });

        // Save each medical value as an extracted metric
        const metricPromises = Array.from(report.values.values()).map(async (value) => {
          return tx.extractedMetric.create({
            data: {
              reportId: reportFile.id,
              name: value.metric,
              value: value.processed.value,
              unit: value.processed.unit,
              category: this.getCategoryFromMetric(value.metric),
              textValue: JSON.stringify({
                confidence: value.processed.confidence,
                raw: value.raw,
                validation: value.validation,
                processing: {
                  method: value.processed.processingMethod,
                  conversionFactor: value.processed.conversionFactor,
                  auditTrail: value.metadata.auditTrail
                }
              })
            }
          });
        });

        await Promise.all(metricPromises);
        return reportFile.id;
      });

      return transaction;
    } catch (error) {
      console.error('Error saving medical report:', error);
      throw new Error(`Failed to save report: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all reports for a user
   */
  async getUserReports(userId: string): Promise<MedicalReport[]> {
    try {
      const reportFiles = await prisma.reportFile.findMany({
        where: { userId },
        include: {
          metrics: true
        },
        orderBy: { reportDate: 'desc' }
      });

      return reportFiles.map((reportFile: any) => this.convertToMedicalReport(reportFile));
    } catch (error) {
      console.error('Error fetching user reports:', error);
      throw new Error(`Failed to fetch reports: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get latest values for all metrics for a user
   */
  async getLatestValues(userId: string): Promise<Map<MetricName, MedicalValue>> {
    try {
      const latestMetrics = await prisma.extractedMetric.findMany({
        where: {
          report: { userId }
        },
        orderBy: [
          { report: { reportDate: 'desc' } },
          { createdAt: 'desc' }
        ]
      });

      const latestMap = new Map<MetricName, MedicalValue>();
      
      for (const metric of latestMetrics) {
        if (!latestMap.has(metric.name as MetricName)) {
          const medicalValue = this.convertToMedicalValue(metric);
          latestMap.set(metric.name as MetricName, medicalValue);
        }
      }

      return latestMap;
    } catch (error) {
      console.error('Error fetching latest values:', error);
      throw new Error(`Failed to fetch latest values: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ================================
  // CHART DATA OPERATIONS
  // ================================

  /**
   * Get clean chart data for a specific metric (with deduplication)
   */
  async getChartSeries(userId: string, metric: MetricName): Promise<ChartSeries> {
    try {
      const parameter = MEDICAL_PARAMETERS[metric];
      if (!parameter) {
        throw new Error(`Unknown metric: ${metric}`);
      }

      // Get all possible names for this metric
      const allNames = [
        metric,
        ...parameter.aliases.names,
        ...parameter.aliases.abbreviations,
        ...parameter.aliases.alternativeSpellings
      ];

      // Fetch raw data
      const rawMetrics = await prisma.extractedMetric.findMany({
        where: {
          report: { userId },
          name: { in: allNames },
          value: { not: null }
        },
        include: {
          report: {
            select: {
              reportDate: true,
              reportType: true,
              id: true
            }
          }
        },
        orderBy: [
          { report: { reportDate: 'asc' } },
          { createdAt: 'asc' }
        ]
      });

      console.log(`📊 Repository: Found ${rawMetrics.length} raw records for ${metric}`);

      // Process and deduplicate data
      const processedData = await this.processChartData(rawMetrics, parameter);
      
      // Calculate statistics
      const values = processedData.map(point => point.value).filter(v => v !== null) as number[];
      const statistics = this.calculateStatistics(values);
      
      // Assess quality
      const quality = this.assessDataQuality(processedData);

      console.log(`📊 Repository: Processed to ${processedData.length} chart points for ${metric}`);

      return {
        metric,
        data: processedData,
        statistics,
        quality
      };
    } catch (error) {
      console.error(`Error fetching chart series for ${metric}:`, error);
      throw new Error(`Failed to fetch chart data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ================================
  // DATA PROCESSING HELPERS
  // ================================

  private async processChartData(
    rawMetrics: any[],
    parameter: any
  ): Promise<ChartDataPoint[]> {
    const dailyGroups = new Map<string, any[]>();

    // Group by date
    rawMetrics.forEach(metric => {
      const dateKey = metric.report.reportDate.toISOString().split('T')[0];
      if (!dailyGroups.has(dateKey)) {
        dailyGroups.set(dateKey, []);
      }
      dailyGroups.get(dateKey)!.push(metric);
    });

    const chartPoints: ChartDataPoint[] = [];

    // Process each day's data
    for (const [dateKey, dayMetrics] of dailyGroups) {
      const bestMetric = this.selectBestMetric(dayMetrics, parameter);
      if (bestMetric && bestMetric.value !== null) {
        
        // Parse metadata if available
        let metadata;
        try {
          metadata = typeof bestMetric.metadata === 'string' 
            ? JSON.parse(bestMetric.metadata) 
            : bestMetric.metadata || {};
        } catch {
          metadata = {};
        }

        // Extract confidence from textValue if available
        let confidence: 'high' | 'medium' | 'low' | 'reject' = 'medium';
        try {
          if (bestMetric.textValue) {
            const parsed = JSON.parse(bestMetric.textValue);
            const parsedConfidence = parsed.confidence;
            confidence = ['high', 'medium', 'low', 'reject'].includes(parsedConfidence) 
              ? parsedConfidence 
              : 'medium';
          }
        } catch {
          confidence = 'medium';
        }

        chartPoints.push({
          date: new Date(dateKey),
          value: bestMetric.value,
          confidence: confidence,
          source: bestMetric.report.reportType || 'unknown',
          metadata: {
            reportId: bestMetric.report.id,
            originalValue: metadata.raw?.value || bestMetric.value,
            originalUnit: metadata.raw?.unit || bestMetric.unit || parameter.units.standard
          }
        });
      }
    }

    return chartPoints;
  }

  private selectBestMetric(dayMetrics: any[], parameter: any): any | null {
    if (dayMetrics.length === 0) return null;
    if (dayMetrics.length === 1) return dayMetrics[0];

    // Scoring criteria for selecting the best metric
    const scoredMetrics = dayMetrics.map(metric => {
      let score = 0;

      // Confidence score
      switch (metric.confidence) {
        case 'high': score += 4; break;
        case 'medium': score += 3; break;
        case 'low': score += 2; break;
        default: score += 1;
      }

      // Value plausibility (within critical range)
      if (metric.value >= parameter.clinical.criticalRange.min && 
          metric.value <= parameter.clinical.criticalRange.max) {
        score += 2;
      }

      // Unit consistency
      if (metric.unit === parameter.units.standard) {
        score += 1;
      }

      // Prefer manual entry over AI extraction (more recent = higher timestamp)
      score += metric.createdAt.getTime() / 1000000000; // Normalize timestamp

      return { metric, score };
    });

    // Return highest scoring metric
    scoredMetrics.sort((a, b) => b.score - a.score);
    return scoredMetrics[0].metric;
  }

  private calculateStatistics(values: number[]) {
    if (values.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        average: 0,
        trend: 'unknown' as const
      };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Simple trend calculation (comparing first half to second half)
    let trend: 'increasing' | 'decreasing' | 'stable' | 'unknown' = 'unknown';
    if (values.length >= 4) {
      const mid = Math.floor(values.length / 2);
      const firstHalf = values.slice(0, mid);
      const secondHalf = values.slice(-mid);
      
      const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
      
      const changePercent = (secondAvg - firstAvg) / firstAvg;
      
      if (changePercent > 0.1) trend = 'increasing';
      else if (changePercent < -0.1) trend = 'decreasing';
      else trend = 'stable';
    }

    return {
      count: values.length,
      min,
      max,
      average,
      trend
    };
  }

  private assessDataQuality(dataPoints: ChartDataPoint[]) {
    if (dataPoints.length === 0) {
      return {
        completeness: 0,
        reliability: 0,
        gaps: []
      };
    }

    // Calculate completeness (based on expected frequency)
    const daySpan = dataPoints.length > 1 
      ? (dataPoints[dataPoints.length - 1].date.getTime() - dataPoints[0].date.getTime()) / (1000 * 60 * 60 * 24)
      : 1;
    
    const completeness = Math.min(1, dataPoints.length / Math.max(1, daySpan / 30)); // Expect monthly data

    // Calculate reliability (based on confidence levels)
    const confidenceScores = dataPoints.map(point => {
      switch (point.confidence) {
        case 'high': return 1.0;
        case 'medium': return 0.7;
        case 'low': return 0.4;
        default: return 0.0;
      }
    });
    
    const reliability = confidenceScores.reduce((sum: number, score: number) => sum + score, 0) / confidenceScores.length;

    // Identify gaps (periods > 90 days without data)
    const gaps: Array<{ start: Date; end: Date }> = [];
    for (let i = 1; i < dataPoints.length; i++) {
      const daysBetween = (dataPoints[i].date.getTime() - dataPoints[i-1].date.getTime()) / (1000 * 60 * 60 * 24);
      if (daysBetween > 90) {
        gaps.push({
          start: dataPoints[i-1].date,
          end: dataPoints[i].date
        });
      }
    }

    return {
      completeness,
      reliability,
      gaps
    };
  }

  // ================================
  // CONVERSION HELPERS
  // ================================

  private convertToMedicalReport(reportFile: any): MedicalReport {
    const values = new Map<MetricName, MedicalValue>();
    
    reportFile.metrics.forEach((metric: any) => {
      const medicalValue = this.convertToMedicalValue(metric);
      values.set(metric.name as MetricName, medicalValue);
    });

    let summary;
    try {
      summary = typeof reportFile.summary === 'string' 
        ? JSON.parse(reportFile.summary) 
        : reportFile.summary || {};
    } catch {
      summary = { quality: { overallScore: 0.5 }, processing: { status: 'completed' } };
    }

    return {
      id: reportFile.id,
      userId: reportFile.userId,
      metadata: {
        type: reportFile.reportType || 'lab_report',
        date: reportFile.reportDate,
        source: 'api',
        version: 1
      },
      values,
      quality: summary.quality || {
        overallScore: 0.5,
        completeness: 0.5,
        confidence: 0.5,
        issues: []
      },
      processing: summary.processing || {
        status: 'completed',
        steps: [],
        errors: [],
        warnings: []
      }
    };
  }

  private convertToMedicalValue(metric: any): MedicalValue {
    let metadata;
    try {
      metadata = typeof metric.metadata === 'string' 
        ? JSON.parse(metric.metadata) 
        : metric.metadata || {};
    } catch {
      metadata = {};
    }

    return {
      id: `val_${metric.id}`,
      metric: metric.name as MetricName,
      raw: {
        value: metadata.raw?.value || metric.value,
        unit: metadata.raw?.unit || metric.unit,
        source: 'api',
        extractedText: metadata.raw?.extractedText
      },
      processed: {
        value: metric.value,
        unit: metric.unit || MEDICAL_PARAMETERS[metric.name as MetricName]?.units.standard || '',
        confidence: (() => {
          try {
            if (metric.textValue) {
              const parsed = JSON.parse(metric.textValue);
              const parsedConfidence = parsed.confidence;
              return ['high', 'medium', 'low', 'reject'].includes(parsedConfidence) 
                ? parsedConfidence 
                : 'medium';
            }
          } catch {}
          return 'medium';
        })() as 'high' | 'medium' | 'low' | 'reject',
        processingMethod: metadata.processing?.method || 'database',
        conversionFactor: metadata.processing?.conversionFactor || 1
      },
      validation: metadata.validation || {
        status: 'valid',
        isWithinNormalRange: true,
        isWithinCriticalRange: true,
        clinicalStatus: 'normal',
        warnings: [],
        suggestions: []
      },
      metadata: {
        reportId: metric.reportId,
        userId: metric.report?.userId || '',
        timestamp: metric.createdAt || new Date(),
        processingStage: 'stored',
        processingVersion: '1.0.0',
        auditTrail: metadata.processing?.auditTrail || []
      }
    };
  }

  private getCategoryFromMetric(metric: MetricName): string {
    const parameter = MEDICAL_PARAMETERS[metric];
    return parameter ? parameter.category : 'unknown';
  }

  // ================================
  // SYSTEM HEALTH
  // ================================

  async getHealth() {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      
      // Get basic stats
      const reportCount = await prisma.reportFile.count();
      const metricCount = await prisma.extractedMetric.count();
      
      return {
        status: 'healthy',
        database: 'connected',
        reports: reportCount,
        metrics: metricCount,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : String(error),
        lastCheck: new Date().toISOString()
      };
    }
  }

  updateConfig(newConfig: PlatformConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clean up resources
   */
  async disconnect() {
    await prisma.$disconnect();
  }
}
