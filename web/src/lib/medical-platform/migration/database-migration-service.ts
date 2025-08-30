/**
 * Database Migration Service for Unit Conversion
 * Handles safe migration of existing data to standardized units
 */

import { PrismaClient } from '@/generated/prisma';
import { EnhancedUnitConverter, EnhancedConversionResult } from '../core/enhanced-unit-converter';
import { MEDICAL_PARAMETERS } from '../core/parameters';

export interface MigrationOptions {
  batchSize?: number;
  dryRun?: boolean;
  skipValidation?: boolean;
  continueOnError?: boolean;
  progressCallback?: (progress: MigrationProgress) => void;
}

export interface MigrationProgress {
  phase: 'analysis' | 'conversion' | 'validation' | 'complete';
  processed: number;
  total: number;
  converted: number;
  errors: number;
  currentBatch?: number;
  totalBatches?: number;
  estimatedTimeRemaining?: number;
}

export interface MigrationResult {
  success: boolean;
  totalRecords: number;
  recordsProcessed: number;
  recordsConverted: number;
  recordsSkipped: number;
  errors: MigrationError[];
  conversions: ConversionRecord[];
  duration: number;
  summary: MigrationSummary;
}

export interface MigrationError {
  recordId: string;
  metricName: string;
  originalValue: number;
  originalUnit: string;
  error: string;
  severity: 'warning' | 'error' | 'critical';
  timestamp: Date;
}

export interface ConversionRecord {
  recordId: string;
  metricName: string;
  originalValue: number;
  originalUnit: string;
  convertedValue: number;
  convertedUnit: string;
  conversionFactor: number;
  conversionRule: string;
  validationStatus: string;
  timestamp: Date;
}

export interface MigrationSummary {
  conversionsByMetric: { [metricName: string]: number };
  errorsByType: { [errorType: string]: number };
  validationResults: { [status: string]: number };
  performanceMetrics: {
    recordsPerSecond: number;
    averageBatchTime: number;
    totalDuration: number;
  };
}

export class DatabaseMigrationService {
  private prisma: PrismaClient;
  private unitConverter: EnhancedUnitConverter;
  private startTime: number = 0;
  private batchTimes: number[] = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.unitConverter = new EnhancedUnitConverter();
  }

  /**
   * Analyze existing data to identify conversion needs
   */
  async analyzeConversionNeeds(): Promise<{
    totalRecords: number;
    needsConversion: number;
    byMetric: { [metricName: string]: { total: number; needsConversion: number; examples: any[] } };
    estimatedDuration: number;
  }> {
    console.log('🔍 Analyzing database for conversion needs...');
    
    const totalRecords = await this.prisma.extractedMetric.count({
      where: { value: { not: null } }
    });

    const metrics = await this.prisma.extractedMetric.findMany({
      where: { 
        value: { not: null },
        wasConverted: false // Only analyze unconverted records
      },
      select: {
        id: true,
        name: true,
        value: true,
        unit: true,
        reportId: true
      }
    });

    const analysis: { [metricName: string]: { total: number; needsConversion: number; examples: any[] } } = {};
    let totalNeedsConversion = 0;

    for (const metric of metrics) {
      if (!analysis[metric.name]) {
        analysis[metric.name] = { total: 0, needsConversion: 0, examples: [] };
      }
      
      analysis[metric.name].total++;

      // Check if conversion is needed
      const conversionResult = this.unitConverter.convertForStorage(
        metric.name,
        metric.value,
        metric.unit
      );

      if (conversionResult.wasConverted) {
        analysis[metric.name].needsConversion++;
        totalNeedsConversion++;

        // Store examples for review
        if (analysis[metric.name].examples.length < 5) {
          analysis[metric.name].examples.push({
            id: metric.id,
            reportId: metric.reportId,
            originalValue: metric.value,
            originalUnit: metric.unit,
            convertedValue: conversionResult.value,
            convertedUnit: conversionResult.unit,
            conversionRule: conversionResult.conversionRule
          });
        }
      }
    }

    // Estimate duration (assuming 100 records per second)
    const estimatedDuration = Math.ceil(totalNeedsConversion / 100);

    console.log(`📊 Analysis complete: ${totalNeedsConversion}/${totalRecords} records need conversion`);
    
    return {
      totalRecords,
      needsConversion: totalNeedsConversion,
      byMetric: analysis,
      estimatedDuration
    };
  }

  /**
   * Execute database migration with comprehensive error handling
   */
  async executeMigration(options: MigrationOptions = {}): Promise<MigrationResult> {
    const {
      batchSize = 100,
      dryRun = false,
      skipValidation = false,
      continueOnError = true,
      progressCallback
    } = options;

    this.startTime = Date.now();
    console.log(`🚀 Starting migration (${dryRun ? 'DRY RUN' : 'LIVE'})...`);

    const result: MigrationResult = {
      success: false,
      totalRecords: 0,
      recordsProcessed: 0,
      recordsConverted: 0,
      recordsSkipped: 0,
      errors: [],
      conversions: [],
      duration: 0,
      summary: {
        conversionsByMetric: {},
        errorsByType: {},
        validationResults: {},
        performanceMetrics: {
          recordsPerSecond: 0,
          averageBatchTime: 0,
          totalDuration: 0
        }
      }
    };

    try {
      // Phase 1: Analysis
      progressCallback?.({ 
        phase: 'analysis', 
        processed: 0, 
        total: 0, 
        converted: 0, 
        errors: 0 
      });

      const analysis = await this.analyzeConversionNeeds();
      result.totalRecords = analysis.totalRecords;

      if (analysis.needsConversion === 0) {
        console.log('✅ No records need conversion');
        result.success = true;
        result.duration = Date.now() - this.startTime;
        return result;
      }

      // Phase 2: Batch Processing
      const totalBatches = Math.ceil(analysis.needsConversion / batchSize);
      let currentBatch = 0;

      while (true) {
        const batchStartTime = Date.now();
        currentBatch++;

        // Get batch of unconverted records
        const batch = await this.getUnconvertedBatch(batchSize, result.recordsProcessed);
        if (batch.length === 0) break;

        progressCallback?.({
          phase: 'conversion',
          processed: result.recordsProcessed,
          total: analysis.needsConversion,
          converted: result.recordsConverted,
          errors: result.errors.length,
          currentBatch,
          totalBatches,
          estimatedTimeRemaining: this.estimateTimeRemaining(
            result.recordsProcessed, 
            analysis.needsConversion
          )
        });

        // Process batch
        const batchResult = await this.processBatch(batch, dryRun, skipValidation, continueOnError);
        
        // Aggregate results
        result.recordsProcessed += batchResult.processed;
        result.recordsConverted += batchResult.converted;
        result.recordsSkipped += batchResult.skipped;
        result.errors.push(...batchResult.errors);
        result.conversions.push(...batchResult.conversions);

        // Track performance
        const batchTime = Date.now() - batchStartTime;
        this.batchTimes.push(batchTime);

        console.log(`✅ Batch ${currentBatch}/${totalBatches} complete: ${batchResult.converted} converted, ${batchResult.errors.length} errors`);

        // Stop on critical errors if not continuing
        if (!continueOnError && batchResult.errors.some(e => e.severity === 'critical')) {
          throw new Error('Critical errors encountered, stopping migration');
        }
      }

      // Phase 3: Validation
      if (!skipValidation && !dryRun) {
        progressCallback?.({ 
          phase: 'validation', 
          processed: result.recordsProcessed, 
          total: analysis.needsConversion, 
          converted: result.recordsConverted, 
          errors: result.errors.length 
        });

        await this.validateMigrationResults(result);
      }

      // Calculate final metrics
      result.duration = Date.now() - this.startTime;
      result.summary = this.generateSummary(result);
      result.success = result.errors.filter(e => e.severity === 'critical').length === 0;

      progressCallback?.({ 
        phase: 'complete', 
        processed: result.recordsProcessed, 
        total: analysis.needsConversion, 
        converted: result.recordsConverted, 
        errors: result.errors.length 
      });

      console.log(`🎉 Migration complete: ${result.recordsConverted} records converted in ${result.duration}ms`);

    } catch (error) {
      result.errors.push({
        recordId: 'MIGRATION',
        metricName: 'SYSTEM',
        originalValue: 0,
        originalUnit: '',
        error: error instanceof Error ? error.message : String(error),
        severity: 'critical',
        timestamp: new Date()
      });
      result.duration = Date.now() - this.startTime;
      console.error('❌ Migration failed:', error);
    }

    return result;
  }

  /**
   * Get batch of unconverted records
   */
  private async getUnconvertedBatch(batchSize: number, offset: number) {
    return await this.prisma.extractedMetric.findMany({
      where: {
        value: { not: null },
        wasConverted: false
      },
      skip: offset,
      take: batchSize,
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Process a batch of records
   */
  private async processBatch(
    batch: any[], 
    dryRun: boolean, 
    skipValidation: boolean, 
    continueOnError: boolean
  ) {
    const result = {
      processed: 0,
      converted: 0,
      skipped: 0,
      errors: [] as MigrationError[],
      conversions: [] as ConversionRecord[]
    };

    for (const record of batch) {
      result.processed++;

      try {
        // Apply conversion
        const conversionResult = this.unitConverter.convertForStorage(
          record.name,
          record.value,
          record.unit
        );

        if (!conversionResult.wasConverted) {
          result.skipped++;
          continue;
        }

        // Validate conversion if not skipped
        let validationStatus = 'valid';
        let validationNotes = '';

        if (!skipValidation) {
          const validation = this.validateConversion(record.name, conversionResult);
          validationStatus = validation.status;
          validationNotes = validation.notes;
        }

        // Record conversion details
        const conversionRecord: ConversionRecord = {
          recordId: record.id,
          metricName: record.name,
          originalValue: record.value,
          originalUnit: record.unit || '',
          convertedValue: conversionResult.value,
          convertedUnit: conversionResult.unit,
          conversionFactor: conversionResult.conversionFactor || 1,
          conversionRule: conversionResult.conversionRule || 'unknown',
          validationStatus,
          timestamp: new Date()
        };

        result.conversions.push(conversionRecord);

        // Update database if not dry run
        if (!dryRun) {
          await this.prisma.extractedMetric.update({
            where: { id: record.id },
            data: {
              // Update standardized values
              value: conversionResult.value,
              unit: conversionResult.unit,
              
              // Store original values
              originalValue: record.value,
              originalUnit: record.unit,
              
              // Conversion metadata
              wasConverted: true,
              conversionFactor: conversionResult.conversionFactor,
              conversionRule: conversionResult.conversionRule,
              conversionDate: new Date(),
              
              // Validation results
              validationStatus,
              validationNotes
            }
          });
        }

        result.converted++;

      } catch (error) {
        const migrationError: MigrationError = {
          recordId: record.id,
          metricName: record.name,
          originalValue: record.value,
          originalUnit: record.unit || '',
          error: error instanceof Error ? error.message : String(error),
          severity: 'error',
          timestamp: new Date()
        };

        result.errors.push(migrationError);

        if (!continueOnError) {
          throw error;
        }
      }
    }

    return result;
  }

  /**
   * Validate conversion result
   */
  private validateConversion(metricName: string, conversionResult: EnhancedConversionResult) {
    const parameter = Object.values(MEDICAL_PARAMETERS).find(p => 
      p.metric.toLowerCase() === metricName.toLowerCase()
    );

    if (!parameter) {
      return { status: 'unknown', notes: 'Parameter not found in medical parameters' };
    }

    const { value } = conversionResult;
    const { criticalRange } = parameter.clinical;

    // Check if value is within reasonable range
    if (value < criticalRange.min * 0.1 || value > criticalRange.max * 10) {
      return { 
        status: 'suspicious', 
        notes: `Value ${value} is outside expected range (${criticalRange.min}-${criticalRange.max})` 
      };
    }

    if (value < criticalRange.min || value > criticalRange.max) {
      return { 
        status: 'abnormal', 
        notes: `Value ${value} is outside normal range (${criticalRange.min}-${criticalRange.max})` 
      };
    }

    return { status: 'valid', notes: 'Value within normal clinical range' };
  }

  /**
   * Validate migration results
   */
  private async validateMigrationResults(result: MigrationResult) {
    console.log('🔍 Validating migration results...');

    // Check for data integrity
    const convertedCount = await this.prisma.extractedMetric.count({
      where: { wasConverted: true }
    });

    if (convertedCount !== result.recordsConverted) {
      result.errors.push({
        recordId: 'VALIDATION',
        metricName: 'DATA_INTEGRITY',
        originalValue: 0,
        originalUnit: '',
        error: `Converted count mismatch: expected ${result.recordsConverted}, found ${convertedCount}`,
        severity: 'critical',
        timestamp: new Date()
      });
    }

    // Validate sample conversions
    const sampleSize = Math.min(100, result.recordsConverted);
    const samples = await this.prisma.extractedMetric.findMany({
      where: { wasConverted: true },
      take: sampleSize,
      orderBy: { conversionDate: 'desc' }
    });

    for (const sample of samples) {
      if (!sample.originalValue || !sample.conversionFactor) {
        result.errors.push({
          recordId: sample.id,
          metricName: sample.name,
          originalValue: sample.originalValue || 0,
          originalUnit: sample.originalUnit || '',
          error: 'Missing conversion metadata',
          severity: 'warning',
          timestamp: new Date()
        });
      }
    }

    console.log(`✅ Validation complete: ${result.errors.filter(e => e.severity === 'critical').length} critical issues found`);
  }

  /**
   * Generate migration summary
   */
  private generateSummary(result: MigrationResult): MigrationSummary {
    const conversionsByMetric: { [metricName: string]: number } = {};
    const errorsByType: { [errorType: string]: number } = {};
    const validationResults: { [status: string]: number } = {};

    // Aggregate conversions by metric
    result.conversions.forEach(conv => {
      conversionsByMetric[conv.metricName] = (conversionsByMetric[conv.metricName] || 0) + 1;
      validationResults[conv.validationStatus] = (validationResults[conv.validationStatus] || 0) + 1;
    });

    // Aggregate errors by type
    result.errors.forEach(error => {
      errorsByType[error.severity] = (errorsByType[error.severity] || 0) + 1;
    });

    // Calculate performance metrics
    const totalDuration = result.duration;
    const recordsPerSecond = result.recordsProcessed / (totalDuration / 1000);
    const averageBatchTime = this.batchTimes.length > 0 
      ? this.batchTimes.reduce((sum, time) => sum + time, 0) / this.batchTimes.length 
      : 0;

    return {
      conversionsByMetric,
      errorsByType,
      validationResults,
      performanceMetrics: {
        recordsPerSecond,
        averageBatchTime,
        totalDuration
      }
    };
  }

  /**
   * Estimate remaining time
   */
  private estimateTimeRemaining(processed: number, total: number): number {
    if (processed === 0 || this.batchTimes.length === 0) return 0;
    
    const averageBatchTime = this.batchTimes.reduce((sum, time) => sum + time, 0) / this.batchTimes.length;
    const remaining = total - processed;
    const batchSize = 100; // Default batch size
    const remainingBatches = Math.ceil(remaining / batchSize);
    
    return remainingBatches * averageBatchTime;
  }

  /**
   * Create rollback point
   */
  async createRollbackPoint(): Promise<string> {
    const timestamp = new Date().toISOString();
    const rollbackId = `rollback_${timestamp.replace(/[:.]/g, '_')}`;
    
    console.log(`📦 Creating rollback point: ${rollbackId}`);
    
    // In a real implementation, this would create a database backup
    // For now, we'll just return the rollback ID
    return rollbackId;
  }

  /**
   * Execute rollback
   */
  async executeRollback(rollbackId: string): Promise<boolean> {
    console.log(`🔄 Executing rollback: ${rollbackId}`);
    
    try {
      // Reset all converted records to original values
      const convertedRecords = await this.prisma.extractedMetric.findMany({
        where: { wasConverted: true }
      });

      for (const record of convertedRecords) {
        if (record.originalValue !== null) {
          await this.prisma.extractedMetric.update({
            where: { id: record.id },
            data: {
              value: record.originalValue,
              unit: record.originalUnit,
              wasConverted: false,
              conversionFactor: null,
              conversionRule: null,
              conversionDate: null,
              validationStatus: null,
              validationNotes: null
            }
          });
        }
      }

      console.log(`✅ Rollback complete: ${convertedRecords.length} records restored`);
      return true;

    } catch (error) {
      console.error('❌ Rollback failed:', error);
      return false;
    }
  }
}