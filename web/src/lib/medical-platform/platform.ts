/**
 * MEDICAL DATA PLATFORM - MAIN INTERFACE
 * Single entry point for all medical data operations
 */

import { MedicalEngine } from './core/engine';
import { DataRepository } from './storage/repository';
import { DataValidator } from './core/validation';
import { DataExtractor } from './processing/extractor';
import { DataNormalizer } from './processing/normalizer';
import { InsightsEngine } from './analytics/insights';
import type {
  MedicalValue,
  MedicalReport,
  ProcessingRequest,
  ProcessingResponse,
  PlatformConfig,
  ChartSeries,
  MetricName
} from './core/types';

/**
 * Main Medical Data Platform
 * Replaces all fragmented systems with a single, comprehensive interface
 */
export class MedicalDataPlatform {
  private engine: MedicalEngine;
  private repository: DataRepository;
  private validator: DataValidator;
  private extractor: DataExtractor;
  private normalizer: DataNormalizer;
  private insights: InsightsEngine;
  private config: PlatformConfig;

  constructor(config: Partial<PlatformConfig> = {}) {
    // Initialize with default production config
    this.config = this.mergeWithDefaults(config);
    
    // Initialize all subsystems
    this.engine = new MedicalEngine(this.config);
    this.repository = new DataRepository(this.config);
    this.validator = new DataValidator(this.config);
    this.extractor = new DataExtractor(this.config);
    this.normalizer = new DataNormalizer(this.config);
    this.insights = new InsightsEngine(this.config);
  }

  // ================================
  // PRIMARY DATA PROCESSING API
  // ================================

  /**
   * Process any medical data through the complete pipeline
   */
  async processData(request: ProcessingRequest): Promise<ProcessingResponse> {
    const startTime = Date.now();
    
    try {
      // Step 1: Extract structured data
      const extractedData = await this.extractor.extract(request);
      
      // Step 2: Normalize and convert units
      const normalizedData = await this.normalizer.normalize(extractedData);
      
      // Step 3: Validate medical values
      const validatedData = await this.validator.validateBatch(normalizedData);
      
      // Step 4: Create medical report
      const report = await this.engine.createReport(normalizedData);
      
      // Step 5: Store in repository
      await this.repository.saveReport(report);
      
      // Step 6: Generate insights
      const insights = await this.insights.analyze(report);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        report,
        summary: {
          valuesProcessed: report.values.size,
          valuesValid: Array.from(report.values.values()).filter(v => v.validation.status === 'valid').length,
          averageConfidence: this.calculateAverageConfidence(report),
          processingTime,
          qualityScore: report.quality.overallScore
        },
        errors: [],
        warnings: report.processing.warnings
      };
      
    } catch (error) {
      return {
        success: false,
        report: {} as MedicalReport,
        summary: {
          valuesProcessed: 0,
          valuesValid: 0,
          averageConfidence: 0,
          processingTime: Date.now() - startTime,
          qualityScore: 0
        },
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      };
    }
  }

  /**
   * Process manual lab entry
   */
  async processManualEntry(
    userId: string,
    labData: Record<string, { value: number; unit?: string }>,
    reportDate: Date,
    reportType: string = 'Manual Lab Entry'
  ): Promise<ProcessingResponse> {
    return this.processData({
      source: 'manual_entry',
      data: {
        userId,
        labData,
        reportDate,
        reportType
      }
    });
  }

  /**
   * Process AI-extracted data from images/PDFs
   */
  async processAIExtraction(
    userId: string,
    extractedJson: any,
    reportDate: Date,
    objectKey: string
  ): Promise<ProcessingResponse> {
    return this.processData({
      source: 'ai_extraction',
      data: {
        userId,
        extracted: extractedJson,
        reportDate,
        objectKey
      }
    });
  }

  // ================================
  // DATA RETRIEVAL API
  // ================================

  /**
   * Get clean chart data for dashboard
   */
  async getChartData(userId: string, metric: MetricName): Promise<ChartSeries> {
    return this.repository.getChartSeries(userId, metric);
  }

  /**
   * Get all reports for a user
   */
  async getUserReports(userId: string): Promise<MedicalReport[]> {
    return this.repository.getUserReports(userId);
  }

  /**
   * Get latest values for all metrics
   */
  async getLatestValues(userId: string): Promise<Map<MetricName, MedicalValue>> {
    return this.repository.getLatestValues(userId);
  }

  // ================================
  // DATA QUALITY API
  // ================================

  /**
   * Analyze data quality for a user
   */
  async analyzeDataQuality(userId: string) {
    return this.insights.analyzeDataQuality(userId);
  }

  /**
   * Detect and fix data corruption
   */
  async fixDataCorruption(userId: string) {
    return this.insights.detectAndFixCorruption(userId);
  }

  /**
   * Detect duplicate data
   */
  async detectDuplicates(userId: string) {
    return this.insights.detectDuplicates(userId);
  }

  // ================================
  // CLINICAL ANALYTICS API
  // ================================

  /**
   * Calculate MELD score
   */
  async calculateMELD(userId: string): Promise<{
    score: number;
    naScore?: number;
    risk: string;
    components: Record<string, number>;
  } | null> {
    return this.insights.calculateMELD(userId);
  }

  /**
   * Generate clinical insights
   */
  async generateInsights(userId: string) {
    return this.insights.generateClinicalInsights(userId);
  }

  // ================================
  // SYSTEM MANAGEMENT API
  // ================================

  /**
   * Get platform health status
   */
  async getSystemHealth() {
    return {
      status: 'healthy',
      version: '1.0.0',
      subsystems: {
        engine: await this.engine.getHealth(),
        repository: await this.repository.getHealth(),
        validator: await this.validator.getHealth(),
        extractor: await this.extractor.getHealth(),
        normalizer: await this.normalizer.getHealth(),
        insights: await this.insights.getHealth()
      }
    };
  }

  /**
   * Update platform configuration
   */
  updateConfig(newConfig: Partial<PlatformConfig>) {
    this.config = this.mergeWithDefaults(newConfig);
    
    // Update all subsystems
    this.engine.updateConfig(this.config);
    this.repository.updateConfig(this.config);
    this.validator.updateConfig(this.config);
    this.extractor.updateConfig(this.config);
    this.normalizer.updateConfig(this.config);
    this.insights.updateConfig(this.config);
  }

  // ================================
  // PRIVATE HELPER METHODS
  // ================================

  private mergeWithDefaults(config: Partial<PlatformConfig>): PlatformConfig {
    return {
      processing: {
        strictMode: false,
        autoCorrection: true,
        confidenceThreshold: 0.7,
        validationLevel: 'normal',
        ...config.processing
      },
      quality: {
        minimumConfidence: 0.5,
        requiredFields: ['ALT', 'AST', 'Platelets'],
        outlierDetection: true,
        duplicateHandling: 'merge',
        ...config.quality
      },
      regional: {
        primaryUnits: 'International',
        timeZone: 'UTC',
        locale: 'en-US',
        ...config.regional
      },
      compliance: {
        auditLevel: 'detailed',
        dataRetention: 2555, // 7 years
        encryptionRequired: true,
        ...config.compliance
      }
    };
  }

  private calculateAverageConfidence(report: MedicalReport): number {
    const values = Array.from(report.values.values());
    if (values.length === 0) return 0;
    
    const confidenceScores = values.map(v => {
      switch (v.processed.confidence) {
        case 'high': return 1.0;
        case 'medium': return 0.7;
        case 'low': return 0.4;
        case 'reject': return 0.0;
        default: return 0.0;
      }
    });
    
    return confidenceScores.reduce((sum: number, score: number) => sum + score, 0) / confidenceScores.length;
  }
}

// ================================
// SINGLETON INSTANCE
// ================================

let platformInstance: MedicalDataPlatform | null = null;

/**
 * Get the singleton platform instance
 */
export function getMedicalPlatform(config?: Partial<PlatformConfig>): MedicalDataPlatform {
  if (!platformInstance) {
    platformInstance = new MedicalDataPlatform(config);
  }
  return platformInstance;
}

/**
 * Reset platform instance (for testing)
 */
export function resetMedicalPlatform(): void {
  platformInstance = null;
}
