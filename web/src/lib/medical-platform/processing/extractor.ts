/**
 * DATA EXTRACTOR
 * Handles extraction of medical data from various sources (AI, manual, files)
 */

import type {
  ProcessingRequest,
  MedicalValue,
  PlatformConfig,
  MetricName
} from '../core/types';
import { MedicalEngine } from '../core/engine';
import { getParameterByName } from '../core/parameters';

/**
 * Medical Data Extractor
 * Processes various input sources into structured medical values
 */
export class DataExtractor {
  private config: PlatformConfig;
  private engine: MedicalEngine;

  constructor(config: PlatformConfig) {
    this.config = config;
    this.engine = new MedicalEngine(config);
  }

  // ================================
  // MAIN EXTRACTION METHODS
  // ================================

  /**
   * Extract medical data from processing request
   */
  async extract(request: ProcessingRequest): Promise<MedicalValue[]> {
    switch (request.source) {
      case 'manual_entry':
        return this.extractFromManualEntry(request.data);
      
      case 'ai_extraction':
        return this.extractFromAIResults(request.data);
      
      case 'file_upload':
        return this.extractFromFileUpload(request.data);
      
      case 'api':
        return this.extractFromAPI(request.data);
      
      default:
        throw new Error(`Unsupported extraction source: ${request.source}`);
    }
  }

  // ================================
  // SOURCE-SPECIFIC EXTRACTORS
  // ================================

  /**
   * Extract from manual lab entry
   */
  private async extractFromManualEntry(data: any): Promise<MedicalValue[]> {
    const { userId, labData, reportDate, reportType } = data;
    const reportId = this.generateReportId();
    const extractedValues: MedicalValue[] = [];

    for (const [metricName, labValue] of Object.entries(labData)) {
      if (!labValue || typeof labValue !== 'object') continue;
      
      const { value, unit } = labValue as { value: number; unit?: string };
      if (value === null || value === undefined || isNaN(value)) continue;

      try {
        // Find the parameter definition
        const parameter = getParameterByName(metricName);
        if (!parameter) {
          console.warn(`Unknown parameter in manual entry: ${metricName}`);
          continue;
        }

        // Process the value through the medical engine
        const medicalValue = await this.engine.processValue(
          parameter.metric,
          value,
          unit || null,
          'manual_entry',
          {
            reportId,
            userId,
            extractedText: `Manual entry: ${metricName} = ${value} ${unit || ''}`
          }
        );

        extractedValues.push(medicalValue);
      } catch (error) {
        console.error(`Error processing manual entry for ${metricName}:`, error);
        // Continue with other values even if one fails
      }
    }

    console.log(`✅ Extractor: Processed ${extractedValues.length} manual entries`);
    return extractedValues;
  }

  /**
   * Extract from AI extraction results
   */
  private async extractFromAIResults(data: any): Promise<MedicalValue[]> {
    const { userId, extracted, reportDate, objectKey } = data;
    const reportId = this.generateReportId();
    
    // Collect all potential metrics from both sources
    const allMetrics = new Map<string, { name: string; value: number; unit?: string; source: string }>();

    // Process structured metrics first (higher priority)
    if (extracted.metrics) {
      for (const [metricName, metricData] of Object.entries(extracted.metrics)) {
        if (!metricData || typeof metricData !== 'object') continue;
        
        const { value, unit } = metricData as { value: number; unit?: string };
        if (value === null || value === undefined || isNaN(value)) continue;

        // Use normalized metric name as key for deduplication
        const parameter = getParameterByName(metricName);
        if (parameter) {
          allMetrics.set(parameter.metric, {
            name: metricName,
            value,
            unit,
            source: 'structured_metrics'
          });
        }
      }
    }

    // Process metricsAll array (lower priority - only add if not already present)
    if (extracted.metricsAll && Array.isArray(extracted.metricsAll)) {
      for (const metric of extracted.metricsAll) {
        if (!metric || typeof metric !== 'object') continue;
        
        const { name, value, unit } = metric;
        if (!name || value === null || value === undefined || isNaN(value)) continue;

        const parameter = getParameterByName(name);
        if (parameter) {
          // Only add if we don't already have this metric from structured source
          if (!allMetrics.has(parameter.metric)) {
            allMetrics.set(parameter.metric, {
              name,
              value,
              unit,
              source: 'metrics_array'
            });
          }
        }
      }
    }

    // Process the deduplicated metrics
    const extractedValues: MedicalValue[] = [];
    for (const [metricKey, metricInfo] of allMetrics) {
      try {
        const medicalValue = await this.engine.processValue(
          metricKey as MetricName,
          metricInfo.value,
          metricInfo.unit || null,
          'ai_extraction',
          {
            reportId,
            userId,
            extractedText: `AI extracted (${metricInfo.source}): ${metricInfo.name} = ${metricInfo.value} ${metricInfo.unit || ''}`
          }
        );

        extractedValues.push(medicalValue);
      } catch (error) {
        console.error(`Error processing AI metric ${metricInfo.name}:`, error);
      }
    }

    console.log(`✅ Extractor: Processed ${extractedValues.length} AI extractions (deduplicated from ${allMetrics.size} unique metrics)`);
    return extractedValues;
  }

  /**
   * Extract from file upload (PDF, image, etc.)
   */
  private async extractFromFileUpload(data: any): Promise<MedicalValue[]> {
    // This would integrate with file processing services
    // For now, delegate to AI extraction if the file has been processed
    if (data.extracted) {
      return this.extractFromAIResults(data);
    }

    console.log('📄 File upload processing not yet implemented');
    return [];
  }

  /**
   * Extract from API data
   */
  private async extractFromAPI(data: any): Promise<MedicalValue[]> {
    const { userId, metrics, reportDate } = data;
    const reportId = this.generateReportId();
    const extractedValues: MedicalValue[] = [];

    if (!metrics || !Array.isArray(metrics)) {
      throw new Error('API data must include metrics array');
    }

    for (const metric of metrics) {
      const { name, value, unit, confidence } = metric;
      if (!name || value === null || value === undefined || isNaN(value)) continue;

      try {
        const parameter = getParameterByName(name);
        if (!parameter) continue;

        const medicalValue = await this.engine.processValue(
          parameter.metric,
          value,
          unit || null,
          'api',
          {
            reportId,
            userId,
            extractedText: `API: ${name} = ${value} ${unit || ''}`
          }
        );

        // Override confidence if provided
        if (confidence) {
          medicalValue.processed.confidence = confidence;
        }

        extractedValues.push(medicalValue);
      } catch (error) {
        console.error(`Error processing API metric ${name}:`, error);
      }
    }

    console.log(`✅ Extractor: Processed ${extractedValues.length} API metrics`);
    return extractedValues;
  }

  // ================================
  // HELPER METHODS
  // ================================

  private generateReportId(): string {
    return `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate extracted data quality
   */
  async validateExtraction(values: MedicalValue[]): Promise<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (values.length === 0) {
      issues.push('No valid medical values extracted');
      recommendations.push('Review source data format and extraction logic');
    }

    // Check for suspicious patterns
    const suspiciousValues = values.filter(v => 
      v.processed.confidence === 'reject' || 
      v.validation.status === 'invalid'
    );

    if (suspiciousValues.length > values.length * 0.5) {
      issues.push('High percentage of suspicious values detected');
      recommendations.push('Review data quality and extraction parameters');
    }

    // Check for duplicate metrics
    const metricCounts = new Map<MetricName, number>();
    values.forEach(v => {
      metricCounts.set(v.metric, (metricCounts.get(v.metric) || 0) + 1);
    });

    const duplicates = Array.from(metricCounts.entries()).filter(([, count]) => count > 1);
    if (duplicates.length > 0) {
      issues.push(`Duplicate metrics detected: ${duplicates.map(([metric]) => metric).join(', ')}`);
      recommendations.push('Implement deduplication logic for same-day values');
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations
    };
  }

  // ================================
  // SYSTEM HEALTH
  // ================================

  async getHealth() {
    return {
      status: 'healthy',
      supportedSources: ['manual_entry', 'ai_extraction', 'file_upload', 'api'],
      lastExtraction: new Date().toISOString(),
      configValid: this.validateConfig()
    };
  }

  updateConfig(newConfig: PlatformConfig) {
    this.config = { ...this.config, ...newConfig };
    this.engine.updateConfig(newConfig);
  }

  private validateConfig(): boolean {
    return !!(
      this.config.processing &&
      this.config.quality &&
      this.engine
    );
  }
}
