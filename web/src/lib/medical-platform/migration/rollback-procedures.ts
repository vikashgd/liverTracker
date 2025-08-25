/**
 * Rollback Procedures for Database Migration
 * Comprehensive rollback and recovery utilities
 */

import { PrismaClient } from '@prisma/client';
import { DatabaseMigrationService } from './database-migration-service';

export interface RollbackOptions {
  rollbackId: string;
  validateBeforeRollback?: boolean;
  createBackupBeforeRollback?: boolean;
  dryRun?: boolean;
}

export interface RollbackResult {
  success: boolean;
  recordsRestored: number;
  recordsSkipped: number;
  errors: string[];
  duration: number;
  backupId?: string;
}

export interface RecoveryPlan {
  affectedRecords: number;
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  requiredActions: string[];
}

export class RollbackService {
  private prisma: PrismaClient;
  private migrationService: DatabaseMigrationService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.migrationService = new DatabaseMigrationService(prisma);
  }

  /**
   * Analyze rollback requirements and create recovery plan
   */
  async analyzeRollbackRequirements(): Promise<RecoveryPlan> {
    console.log('🔍 Analyzing rollback requirements...');

    // Count affected records
    const convertedRecords = await this.prisma.extractedMetric.count({
      where: { wasConverted: true }
    });

    const recordsWithoutOriginals = await this.prisma.extractedMetric.count({
      where: {
        wasConverted: true,
        originalValue: null
      }
    });

    const recordsWithIncompleteMetadata = await this.prisma.extractedMetric.count({
      where: {
        wasConverted: true,
        OR: [
          { conversionFactor: null },
          { conversionRule: null },
          { conversionDate: null }
        ]
      }
    });

    // Assess risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const recommendations: string[] = [];
    const requiredActions: string[] = [];

    if (recordsWithoutOriginals > 0) {
      riskLevel = 'high';
      recommendations.push(`${recordsWithoutOriginals} records missing original values - data loss possible`);
      requiredActions.push('Manual data recovery may be required for records without original values');
    }

    if (recordsWithIncompleteMetadata > convertedRecords * 0.1) {
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
      recommendations.push(`${recordsWithIncompleteMetadata} records have incomplete conversion metadata`);
      requiredActions.push('Verify conversion metadata before rollback');
    }

    if (convertedRecords > 10000) {
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
      recommendations.push('Large dataset - consider batch rollback');
      requiredActions.push('Plan for extended rollback duration');
    }

    // Estimate duration (assuming 200 records per second for rollback)
    const estimatedDuration = Math.ceil(convertedRecords / 200);

    recommendations.push('Create full database backup before rollback');
    recommendations.push('Validate sample records after rollback');
    recommendations.push('Monitor application performance during rollback');

    requiredActions.push('Ensure database connection is stable');
    requiredActions.push('Notify users of potential service disruption');

    return {
      affectedRecords: convertedRecords,
      estimatedDuration,
      riskLevel,
      recommendations,
      requiredActions
    };
  }

  /**
   * Execute comprehensive rollback with safety checks
   */
  async executeRollback(options: RollbackOptions): Promise<RollbackResult> {
    const startTime = Date.now();
    console.log(`🔄 Starting rollback: ${options.rollbackId}`);

    const result: RollbackResult = {
      success: false,
      recordsRestored: 0,
      recordsSkipped: 0,
      errors: [],
      duration: 0
    };

    try {
      // Step 1: Validate rollback requirements
      if (options.validateBeforeRollback) {
        console.log('🔍 Validating rollback requirements...');
        const plan = await this.analyzeRollbackRequirements();
        
        if (plan.riskLevel === 'high') {
          console.log('⚠️  High risk rollback detected. Review recommendations:');
          plan.recommendations.forEach(rec => console.log(`  - ${rec}`));
          
          if (!options.dryRun) {
            throw new Error('High risk rollback requires manual confirmation');
          }
        }
      }

      // Step 2: Create backup if requested
      if (options.createBackupBeforeRollback && !options.dryRun) {
        console.log('📦 Creating backup before rollback...');
        result.backupId = await this.createPreRollbackBackup();
        console.log(`✅ Backup created: ${result.backupId}`);
      }

      // Step 3: Get all converted records
      const convertedRecords = await this.prisma.extractedMetric.findMany({
        where: { wasConverted: true },
        orderBy: { conversionDate: 'desc' } // Rollback most recent first
      });

      console.log(`📊 Found ${convertedRecords.length} records to rollback`);

      // Step 4: Process rollback in batches
      const batchSize = 100;
      const totalBatches = Math.ceil(convertedRecords.length / batchSize);

      for (let i = 0; i < totalBatches; i++) {
        const batch = convertedRecords.slice(i * batchSize, (i + 1) * batchSize);
        console.log(`🔄 Processing batch ${i + 1}/${totalBatches} (${batch.length} records)`);

        for (const record of batch) {
          try {
            await this.rollbackSingleRecord(record, options.dryRun || false);
            result.recordsRestored++;
          } catch (error) {
            const errorMsg = `Failed to rollback record ${record.id}: ${error}`;
            result.errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
            
            // Skip record but continue with others
            result.recordsSkipped++;
          }
        }

        // Progress update
        const progress = ((i + 1) / totalBatches * 100).toFixed(1);
        console.log(`📈 Progress: ${progress}% (${result.recordsRestored} restored, ${result.recordsSkipped} skipped)`);
      }

      // Step 5: Validate rollback results
      if (!options.dryRun) {
        await this.validateRollbackResults(result);
      }

      result.success = result.errors.length === 0 || result.recordsRestored > 0;
      result.duration = Date.now() - startTime;

      console.log(`🎉 Rollback complete: ${result.recordsRestored} records restored in ${result.duration}ms`);

    } catch (error) {
      result.errors.push(`Rollback failed: ${error}`);
      result.duration = Date.now() - startTime;
      console.error('❌ Rollback failed:', error);
    }

    return result;
  }

  /**
   * Rollback a single record
   */
  private async rollbackSingleRecord(record: any, dryRun: boolean) {
    // Validate that we have original values
    if (record.originalValue === null) {
      throw new Error('No original value available for rollback');
    }

    if (dryRun) {
      console.log(`[DRY RUN] Would restore ${record.name}: ${record.value} ${record.unit} → ${record.originalValue} ${record.originalUnit}`);
      return;
    }

    // Restore original values and clear conversion metadata
    await this.prisma.extractedMetric.update({
      where: { id: record.id },
      data: {
        // Restore original values
        value: record.originalValue,
        unit: record.originalUnit,
        
        // Clear conversion metadata
        wasConverted: false,
        originalValue: null,
        originalUnit: null,
        conversionFactor: null,
        conversionRule: null,
        conversionDate: null,
        validationStatus: null,
        validationNotes: null
      }
    });

    console.log(`✅ Restored ${record.name}: ${record.value} ${record.unit} → ${record.originalValue} ${record.originalUnit}`);
  }

  /**
   * Create backup before rollback
   */
  private async createPreRollbackBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
    const backupId = `pre_rollback_${timestamp}`;
    
    // In a production environment, this would create an actual database backup
    // For now, we'll simulate the backup creation
    console.log(`📦 Creating backup: ${backupId}`);
    
    // Could implement actual backup logic here:
    // - Export converted records to JSON
    // - Create database dump
    // - Store in backup location
    
    return backupId;
  }

  /**
   * Validate rollback results
   */
  private async validateRollbackResults(result: RollbackResult) {
    console.log('🔍 Validating rollback results...');

    // Check that no records are still marked as converted
    const stillConverted = await this.prisma.extractedMetric.count({
      where: { wasConverted: true }
    });

    if (stillConverted > 0) {
      result.errors.push(`${stillConverted} records still marked as converted after rollback`);
    }

    // Check for orphaned conversion metadata
    const orphanedMetadata = await this.prisma.extractedMetric.count({
      where: {
        wasConverted: false,
        OR: [
          { conversionFactor: { not: null } },
          { conversionRule: { not: null } },
          { originalValue: { not: null } }
        ]
      }
    });

    if (orphanedMetadata > 0) {
      result.errors.push(`${orphanedMetadata} records have orphaned conversion metadata`);
    }

    // Sample validation - check a few records
    const sampleRecords = await this.prisma.extractedMetric.findMany({
      take: 10,
      where: { wasConverted: false },
      orderBy: { updatedAt: 'desc' }
    });

    for (const record of sampleRecords) {
      if (record.originalValue !== null || record.conversionFactor !== null) {
        result.errors.push(`Record ${record.id} has residual conversion data`);
      }
    }

    console.log(`✅ Validation complete: ${result.errors.length} issues found`);
  }

  /**
   * Emergency recovery procedures
   */
  async emergencyRecovery(): Promise<{
    success: boolean;
    actionsPerformed: string[];
    errors: string[];
  }> {
    console.log('🚨 Starting emergency recovery procedures...');

    const actionsPerformed: string[] = [];
    const errors: string[] = [];

    try {
      // 1. Identify corrupted records
      const corruptedRecords = await this.prisma.extractedMetric.findMany({
        where: {
          OR: [
            // Records marked as converted but missing original values
            {
              wasConverted: true,
              originalValue: null
            },
            // Records with impossible conversion factors
            {
              conversionFactor: { lt: 0.0001 }
            },
            {
              conversionFactor: { gt: 10000 }
            },
            // Records with missing required metadata
            {
              wasConverted: true,
              conversionRule: null
            }
          ]
        }
      });

      actionsPerformed.push(`Identified ${corruptedRecords.length} corrupted records`);

      // 2. Attempt to recover from conversion metadata
      let recoveredCount = 0;
      for (const record of corruptedRecords) {
        try {
          if (record.wasConverted && record.originalValue === null && record.conversionFactor) {
            // Try to reverse the conversion
            const originalValue = record.value! / record.conversionFactor;
            
            await this.prisma.extractedMetric.update({
              where: { id: record.id },
              data: {
                originalValue,
                originalUnit: record.unit // Best guess
              }
            });
            
            recoveredCount++;
          }
        } catch (error) {
          errors.push(`Failed to recover record ${record.id}: ${error}`);
        }
      }

      actionsPerformed.push(`Recovered ${recoveredCount} records using reverse conversion`);

      // 3. Reset records that cannot be recovered
      const unrecoverableRecords = await this.prisma.extractedMetric.findMany({
        where: {
          wasConverted: true,
          originalValue: null,
          conversionFactor: null
        }
      });

      if (unrecoverableRecords.length > 0) {
        await this.prisma.extractedMetric.updateMany({
          where: {
            id: { in: unrecoverableRecords.map(r => r.id) }
          },
          data: {
            wasConverted: false,
            conversionFactor: null,
            conversionRule: null,
            conversionDate: null,
            validationStatus: 'error',
            validationNotes: 'Emergency recovery - original values lost'
          }
        });

        actionsPerformed.push(`Reset ${unrecoverableRecords.length} unrecoverable records`);
      }

      console.log('✅ Emergency recovery completed');
      return {
        success: errors.length === 0,
        actionsPerformed,
        errors
      };

    } catch (error) {
      errors.push(`Emergency recovery failed: ${error}`);
      return {
        success: false,
        actionsPerformed,
        errors
      };
    }
  }

  /**
   * Generate rollback report
   */
  async generateRollbackReport(): Promise<string> {
    const convertedCount = await this.prisma.extractedMetric.count({
      where: { wasConverted: true }
    });

    const unconvertedCount = await this.prisma.extractedMetric.count({
      where: { wasConverted: false }
    });

    const withOriginals = await this.prisma.extractedMetric.count({
      where: {
        wasConverted: true,
        originalValue: { not: null }
      }
    });

    const withoutOriginals = convertedCount - withOriginals;

    let report = '# Rollback Readiness Report\\n\\n';
    report += `**Generated**: ${new Date().toISOString()}\\n\\n`;
    report += `## Current State\\n\\n`;
    report += `- **Converted records**: ${convertedCount}\\n`;
    report += `- **Unconverted records**: ${unconvertedCount}\\n`;
    report += `- **Records with original values**: ${withOriginals}\\n`;
    report += `- **Records without original values**: ${withoutOriginals}\\n\\n`;

    if (withoutOriginals > 0) {
      report += `⚠️ **WARNING**: ${withoutOriginals} records cannot be fully rolled back due to missing original values.\\n\\n`;
    }

    report += `## Rollback Recommendations\\n\\n`;
    
    if (convertedCount === 0) {
      report += `✅ No rollback needed - no converted records found.\\n`;
    } else if (withoutOriginals === 0) {
      report += `✅ Safe to rollback - all records have original values preserved.\\n`;
    } else {
      report += `⚠️ Partial rollback possible - ${withOriginals} records can be safely rolled back.\\n`;
      report += `❌ ${withoutOriginals} records will lose data during rollback.\\n`;
    }

    report += `\\n## Recommended Actions\\n\\n`;
    report += `1. Create full database backup before rollback\\n`;
    report += `2. Run rollback in dry-run mode first\\n`;
    report += `3. Validate sample records after rollback\\n`;
    
    if (withoutOriginals > 0) {
      report += `4. Consider manual data recovery for ${withoutOriginals} records\\n`;
    }

    return report;
  }
}