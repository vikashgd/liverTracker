/**
 * Batch Execution System for Database Migration
 * Real-time batch processing with monitoring, progress tracking, and error recovery
 */

import { PrismaClient } from '@prisma/client';
import { enhancedUnitConverter, EnhancedConversionResult } from '../core/enhanced-unit-converter';
import { validateClinically, ClinicalContext } from '../core/clinical-validation';

export interface BatchExecutionOptions {
  batchSize: number;
  maxConcurrentBatches: number;
  retryAttempts: number;
  retryDelay: number;
  progressCallback?: (progress: BatchProgress) => void;
  errorCallback?: (error: BatchError) => void;
  validationEnabled: boolean;
  dryRun: boolean;
  continueOnError: boolean;
}

export interface BatchProgress {
  batchId: string;
  batchNumber: number;
  totalBatches: number;
  recordsInBatch: number;
  recordsProcessed: number;
  recordsConverted: number;
  recordsSkipped: number;
  recordsErrored: number;
  startTime: Date;
  estimatedCompletion?: Date;
  currentRecord?: {
    id: string;
    name: string;
    value: number;
    unit: string;
  };
}

export interface BatchError {
  batchId: string;
  recordId: string;
  metricName: string;
  error: string;
  severity: 'warning' | 'error' | 'critical';
  retryCount: number;
  timestamp: Date;
}

export interface BatchResult {
  batchId: string;
  success: boolean;
  recordsProcessed: number;
  recordsConverted: number;
  recordsSkipped: number;
  recordsErrored: number;
  errors: BatchError[];
  duration: number;
  throughput: number; // records per second
}

export interface ExecutionSummary {
  totalBatches: number;
  successfulBatches: number;
  failedBatches: number;
  totalRecordsProcessed: number;
  totalRecordsConverted: number;
  totalRecordsSkipped: number;
  totalRecordsErrored: number;
  totalDuration: number;
  averageThroughput: number;
  errors: BatchError[];
  performanceMetrics: {
    fastestBatch: { id: string; duration: number; throughput: number };
    slowestBatch: { id: string; duration: number; throughput: number };
    averageBatchTime: number;
    errorRate: number;
  };
}

export class BatchExecutor {
  private prisma: PrismaClient;
  private options: BatchExecutionOptions;
  private isRunning: boolean = false;
  private shouldStop: boolean = false;
  private currentBatches: Map<string, BatchProgress> = new Map();
  private completedBatches: BatchResult[] = [];
  private allErrors: BatchError[] = [];

  constructor(prisma: PrismaClient, options: Partial<BatchExecutionOptions> = {}) {
    this.prisma = prisma;
    this.options = {
      batchSize: 100,
      maxConcurrentBatches: 3,
      retryAttempts: 3,
      retryDelay: 1000,
      validationEnabled: true,
      dryRun: false,
      continueOnError: true,
      ...options
    };
  }

  /**
   * Execute migration in batches with comprehensive monitoring
   */
  async executeMigration(): Promise<ExecutionSummary> {
    if (this.isRunning) {
      throw new Error('Migration is already running');
    }

    this.isRunning = true;
    this.shouldStop = false;
    this.currentBatches.clear();
    this.completedBatches = [];
    this.allErrors = [];

    const startTime = Date.now();
    console.log('🚀 Starting batch migration execution...');

    try {
      // Get total count of records needing conversion
      const totalRecords = await this.getTotalRecordsNeedingConversion();
      const totalBatches = Math.ceil(totalRecords / this.options.batchSize);

      console.log(`📊 Processing ${totalRecords} records in ${totalBatches} batches`);

      // Execute batches with concurrency control
      await this.executeBatchesWithConcurrency(totalBatches);

      // Generate execution summary
      const summary = this.generateExecutionSummary(Date.now() - startTime);
      
      console.log(`✅ Migration execution complete: ${summary.totalRecordsConverted} records converted`);
      return summary;

    } catch (error) {
      console.error('❌ Migration execution failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Execute batches with concurrency control
   */
  private async executeBatchesWithConcurrency(totalBatches: number): Promise<void> {
    const batchPromises: Promise<void>[] = [];
    let currentBatchNumber = 1;

    while (currentBatchNumber <= totalBatches && !this.shouldStop) {
      // Wait if we've reached max concurrent batches
      if (batchPromises.length >= this.options.maxConcurrentBatches) {
        await Promise.race(batchPromises);
        // Remove completed promises
        for (let i = batchPromises.length - 1; i >= 0; i--) {
          if (await this.isPromiseResolved(batchPromises[i])) {
            batchPromises.splice(i, 1);
          }
        }
      }

      // Start new batch
      const batchId = `batch_${currentBatchNumber}_${Date.now()}`;
      const batchPromise = this.executeSingleBatch(
        batchId,
        currentBatchNumber,
        totalBatches
      );
      
      batchPromises.push(batchPromise);
      currentBatchNumber++;

      // Small delay to prevent overwhelming the database
      await this.delay(100);
    }

    // Wait for all remaining batches to complete
    await Promise.all(batchPromises);
  }

  /**
   * Execute a single batch
   */
  private async executeSingleBatch(
    batchId: string,
    batchNumber: number,
    totalBatches: number
  ): Promise<void> {
    const batchStartTime = Date.now();
    
    // Initialize batch progress
    const progress: BatchProgress = {
      batchId,
      batchNumber,
      totalBatches,
      recordsInBatch: 0,
      recordsProcessed: 0,
      recordsConverted: 0,
      recordsSkipped: 0,
      recordsErrored: 0,
      startTime: new Date()
    };

    this.currentBatches.set(batchId, progress);

    try {
      // Get batch records
      const offset = (batchNumber - 1) * this.options.batchSize;
      const batchRecords = await this.getBatchRecords(offset, this.options.batchSize);
      
      progress.recordsInBatch = batchRecords.length;
      progress.estimatedCompletion = new Date(
        Date.now() + (batchRecords.length * 100) // Rough estimate: 100ms per record
      );

      console.log(`📦 Processing batch ${batchNumber}/${totalBatches}: ${batchRecords.length} records`);

      // Process each record in the batch
      for (const record of batchRecords) {
        if (this.shouldStop) break;

        progress.currentRecord = {
          id: record.id,
          name: record.name,
          value: record.value,
          unit: record.unit
        };

        await this.processRecord(record, batchId, progress);
        progress.recordsProcessed++;

        // Report progress periodically
        if (progress.recordsProcessed % 10 === 0) {
          this.options.progressCallback?.(progress);
        }
      }

      // Create batch result
      const batchResult: BatchResult = {
        batchId,
        success: progress.recordsErrored === 0,
        recordsProcessed: progress.recordsProcessed,
        recordsConverted: progress.recordsConverted,
        recordsSkipped: progress.recordsSkipped,
        recordsErrored: progress.recordsErrored,
        errors: this.allErrors.filter(e => e.batchId === batchId),
        duration: Date.now() - batchStartTime,
        throughput: progress.recordsProcessed / ((Date.now() - batchStartTime) / 1000)
      };

      this.completedBatches.push(batchResult);
      console.log(`✅ Batch ${batchNumber} complete: ${progress.recordsConverted} converted, ${progress.recordsErrored} errors`);

    } catch (error) {
      const batchError: BatchError = {
        batchId,
        recordId: 'BATCH_ERROR',
        metricName: 'BATCH_EXECUTION',
        error: error instanceof Error ? error.message : String(error),
        severity: 'critical',
        retryCount: 0,
        timestamp: new Date()
      };

      this.allErrors.push(batchError);
      this.options.errorCallback?.(batchError);

      console.error(`❌ Batch ${batchNumber} failed:`, error);

      if (!this.options.continueOnError) {
        this.shouldStop = true;
        throw error;
      }
    } finally {
      this.currentBatches.delete(batchId);
    }
  }

  /**
   * Process a single record with retry logic
   */
  private async processRecord(
    record: any,
    batchId: string,
    progress: BatchProgress
  ): Promise<void> {
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= this.options.retryAttempts) {
      try {
        // Apply conversion
        const conversionResult = enhancedUnitConverter.convertForStorage(
          record.name,
          record.value,
          record.unit
        );

        // Skip if no conversion needed
        if (!conversionResult.wasConverted) {
          progress.recordsSkipped++;
          return;
        }

        // Apply clinical validation if enabled
        if (this.options.validationEnabled) {
          const clinicalValidation = validateClinically(
            record.name,
            conversionResult,
            this.createClinicalContext(record)
          );

          // Update validation status based on clinical validation
          if (clinicalValidation.riskLevel === 'critical') {
            conversionResult.validationStatus = 'error';
            conversionResult.validationNotes = `Clinical validation failed: ${clinicalValidation.clinicalSignificance}`;
          }
        }

        // Update database if not dry run
        if (!this.options.dryRun) {
          await this.updateRecordInDatabase(record.id, conversionResult);
        }

        progress.recordsConverted++;
        
        // Log successful conversion
        if (this.options.dryRun) {
          console.log(`[DRY RUN] Would convert ${record.name}: ${record.value} ${record.unit} → ${conversionResult.value} ${conversionResult.unit}`);
        }

        return; // Success - exit retry loop

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        retryCount++;

        if (retryCount <= this.options.retryAttempts) {
          console.warn(`⚠️ Retry ${retryCount}/${this.options.retryAttempts} for record ${record.id}: ${lastError.message}`);
          await this.delay(this.options.retryDelay * retryCount); // Exponential backoff
        }
      }
    }

    // All retries failed
    const batchError: BatchError = {
      batchId,
      recordId: record.id,
      metricName: record.name,
      error: lastError?.message || 'Unknown error',
      severity: 'error',
      retryCount,
      timestamp: new Date()
    };

    this.allErrors.push(batchError);
    this.options.errorCallback?.(batchError);
    progress.recordsErrored++;

    console.error(`❌ Failed to process record ${record.id} after ${retryCount} attempts: ${lastError?.message}`);
  }

  /**
   * Update record in database with conversion results
   */
  private async updateRecordInDatabase(
    recordId: string,
    conversionResult: EnhancedConversionResult
  ): Promise<void> {
    await this.prisma.extractedMetric.update({
      where: { id: recordId },
      data: {
        // Update standardized values
        value: conversionResult.value,
        unit: conversionResult.unit,
        
        // Store original values
        originalValue: conversionResult.originalValue,
        originalUnit: conversionResult.originalUnit,
        
        // Conversion metadata
        wasConverted: conversionResult.wasConverted,
        conversionFactor: conversionResult.conversionFactor,
        conversionRule: conversionResult.conversionRule,
        conversionDate: conversionResult.conversionDate,
        
        // Validation results
        validationStatus: conversionResult.validationStatus,
        validationNotes: conversionResult.validationNotes
      }
    });
  }

  /**
   * Get total count of records needing conversion
   */
  private async getTotalRecordsNeedingConversion(): Promise<number> {
    return await this.prisma.extractedMetric.count({
      where: {
        value: { not: null },
        wasConverted: false
      }
    });
  }

  /**
   * Get batch of records for processing
   */
  private async getBatchRecords(offset: number, limit: number) {
    return await this.prisma.extractedMetric.findMany({
      where: {
        value: { not: null },
        wasConverted: false
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'asc' }, // Process oldest first
      select: {
        id: true,
        name: true,
        value: true,
        unit: true,
        reportId: true,
        createdAt: true
      }
    });
  }

  /**
   * Create clinical context for validation
   */
  private createClinicalContext(record: any): ClinicalContext {
    // In a real implementation, this would fetch patient data
    // For now, return empty context
    return {};
  }

  /**
   * Generate execution summary
   */
  private generateExecutionSummary(totalDuration: number): ExecutionSummary {
    const totalRecordsProcessed = this.completedBatches.reduce((sum, batch) => sum + batch.recordsProcessed, 0);
    const totalRecordsConverted = this.completedBatches.reduce((sum, batch) => sum + batch.recordsConverted, 0);
    const totalRecordsSkipped = this.completedBatches.reduce((sum, batch) => sum + batch.recordsSkipped, 0);
    const totalRecordsErrored = this.completedBatches.reduce((sum, batch) => sum + batch.recordsErrored, 0);

    const successfulBatches = this.completedBatches.filter(b => b.success).length;
    const failedBatches = this.completedBatches.length - successfulBatches;

    // Performance metrics
    const batchDurations = this.completedBatches.map(b => b.duration);
    const batchThroughputs = this.completedBatches.map(b => b.throughput);
    
    const fastestBatch = this.completedBatches.reduce((fastest, batch) => 
      batch.throughput > fastest.throughput ? batch : fastest
    );
    
    const slowestBatch = this.completedBatches.reduce((slowest, batch) => 
      batch.throughput < slowest.throughput ? batch : slowest
    );

    const averageBatchTime = batchDurations.length > 0 
      ? batchDurations.reduce((sum, duration) => sum + duration, 0) / batchDurations.length 
      : 0;

    const averageThroughput = totalDuration > 0 ? totalRecordsProcessed / (totalDuration / 1000) : 0;
    const errorRate = totalRecordsProcessed > 0 ? (totalRecordsErrored / totalRecordsProcessed) * 100 : 0;

    return {
      totalBatches: this.completedBatches.length,
      successfulBatches,
      failedBatches,
      totalRecordsProcessed,
      totalRecordsConverted,
      totalRecordsSkipped,
      totalRecordsErrored,
      totalDuration,
      averageThroughput,
      errors: this.allErrors,
      performanceMetrics: {
        fastestBatch: {
          id: fastestBatch.batchId,
          duration: fastestBatch.duration,
          throughput: fastestBatch.throughput
        },
        slowestBatch: {
          id: slowestBatch.batchId,
          duration: slowestBatch.duration,
          throughput: slowestBatch.throughput
        },
        averageBatchTime,
        errorRate
      }
    };
  }

  /**
   * Stop migration execution
   */
  stopExecution(): void {
    console.log('🛑 Stopping migration execution...');
    this.shouldStop = true;
  }

  /**
   * Get current execution status
   */
  getExecutionStatus(): {
    isRunning: boolean;
    currentBatches: BatchProgress[];
    completedBatches: number;
    totalErrors: number;
  } {
    return {
      isRunning: this.isRunning,
      currentBatches: Array.from(this.currentBatches.values()),
      completedBatches: this.completedBatches.length,
      totalErrors: this.allErrors.length
    };
  }

  // Helper methods
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async isPromiseResolved(promise: Promise<any>): Promise<boolean> {
    try {
      await Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 0))
      ]);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Utility function to execute migration with default options
 */
export async function executeMigrationBatches(
  prisma: PrismaClient,
  options: Partial<BatchExecutionOptions> = {}
): Promise<ExecutionSummary> {
  const executor = new BatchExecutor(prisma, options);
  return await executor.executeMigration();
}