#!/usr/bin/env node

/**
 * Migration CLI Utility
 * Command-line interface for database unit conversion migration
 */

import { PrismaClient } from '@prisma/client';
import { DatabaseMigrationService, MigrationOptions, MigrationProgress } from './database-migration-service';

const prisma = new PrismaClient();
const migrationService = new DatabaseMigrationService(prisma);

interface CLIOptions {
  command: 'analyze' | 'migrate' | 'rollback' | 'validate';
  dryRun?: boolean;
  batchSize?: number;
  skipValidation?: boolean;
  continueOnError?: boolean;
  rollbackId?: string;
  verbose?: boolean;
}

class MigrationCLI {
  private options: CLIOptions;

  constructor(options: CLIOptions) {
    this.options = options;
  }

  async execute() {
    try {
      console.log('🚀 Database Unit Conversion Migration CLI');
      console.log('==========================================');
      
      switch (this.options.command) {
        case 'analyze':
          await this.runAnalysis();
          break;
        case 'migrate':
          await this.runMigration();
          break;
        case 'rollback':
          await this.runRollback();
          break;
        case 'validate':
          await this.runValidation();
          break;
        default:
          this.showHelp();
      }
    } catch (error) {
      console.error('❌ CLI execution failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }

  private async runAnalysis() {
    console.log('📊 Analyzing database for conversion needs...');
    
    const analysis = await migrationService.analyzeConversionNeeds();
    
    console.log('\\n📋 Analysis Results:');
    console.log(`Total records: ${analysis.totalRecords}`);
    console.log(`Need conversion: ${analysis.needsConversion}`);
    console.log(`Estimated duration: ${analysis.estimatedDuration} seconds`);
    
    console.log('\\n📈 By Metric:');
    Object.entries(analysis.byMetric).forEach(([metric, data]) => {
      if (data.needsConversion > 0) {
        console.log(`  ${metric}: ${data.needsConversion}/${data.total} records`);
        
        if (this.options.verbose && data.examples.length > 0) {
          console.log('    Examples:');
          data.examples.forEach(example => {
            console.log(`      ${example.originalValue} ${example.originalUnit} → ${example.convertedValue} ${example.convertedUnit}`);
          });
        }
      }
    });
    
    if (analysis.needsConversion === 0) {
      console.log('✅ No records need conversion!');
    } else {
      console.log(`\\n💡 To proceed with migration, run:`);
      console.log(`   npm run migrate -- migrate ${this.options.dryRun ? '--dry-run' : ''}`);
    }
  }

  private async runMigration() {
    const isDryRun = this.options.dryRun || false;
    
    console.log(`🔄 Starting migration (${isDryRun ? 'DRY RUN' : 'LIVE MODE'})...`);
    
    if (!isDryRun) {
      console.log('⚠️  This will modify your database. Creating rollback point...');
      const rollbackId = await migrationService.createRollbackPoint();
      console.log(`📦 Rollback point created: ${rollbackId}`);
      console.log(`💡 To rollback if needed: npm run migrate -- rollback --rollback-id ${rollbackId}`);
    }

    // Import batch executor
    const { BatchExecutor } = await import('./batch-executor');
    const { createMigrationMonitor } = await import('./migration-monitor');
    
    // Create batch executor with options
    const batchExecutor = new BatchExecutor(prisma, {
      batchSize: this.options.batchSize || 100,
      maxConcurrentBatches: 3,
      retryAttempts: 3,
      retryDelay: 1000,
      validationEnabled: !this.options.skipValidation,
      dryRun: isDryRun,
      continueOnError: this.options.continueOnError || true,
      progressCallback: this.createBatchProgressCallback(),
      errorCallback: this.createBatchErrorCallback()
    });

    // Create and start monitoring
    const monitor = createMigrationMonitor({
      enableAlerts: true,
      enablePerformanceTracking: true,
      reportingInterval: 30
    });
    
    monitor.startMonitoring();
    
    // Set up monitoring event handlers
    monitor.on('alert', (alert) => {
      console.log(`🚨 ${alert.severity.toUpperCase()}: ${alert.message}`);
    });
    
    monitor.on('monitoringReport', (report) => {
      if (this.options.verbose) {
        console.log(`📊 Status: ${report.overallStatus} | Throughput: ${report.averageThroughput.toFixed(1)} records/sec | Alerts: ${report.activeAlerts.length}`);
      }
    });

    const startTime = Date.now();
    
    try {
      // Execute migration with batch processing
      const result = await batchExecutor.executeMigration();
      const duration = Date.now() - startTime;
      
      // Stop monitoring
      monitor.stopMonitoring();

      console.log('\\n🎉 Migration Results:');
      console.log(`Status: ${result.successfulBatches === result.totalBatches ? '✅ Success' : '⚠️ Partial Success'}`);
      console.log(`Duration: ${Math.ceil(duration / 1000 / 60)} minutes`);
      console.log(`Total batches: ${result.totalBatches}`);
      console.log(`Successful batches: ${result.successfulBatches}`);
      console.log(`Failed batches: ${result.failedBatches}`);
      console.log(`Records processed: ${result.totalRecordsProcessed.toLocaleString()}`);
      console.log(`Records converted: ${result.totalRecordsConverted.toLocaleString()}`);
      console.log(`Records skipped: ${result.totalRecordsSkipped.toLocaleString()}`);
      console.log(`Records errored: ${result.totalRecordsErrored.toLocaleString()}`);

      if (result.errors.length > 0) {
        console.log('\\n⚠️  Errors encountered:');
        const errorsByType = result.errors.reduce((acc, error) => {
          acc[error.severity] = (acc[error.severity] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });
        
        Object.entries(errorsByType).forEach(([severity, count]) => {
          console.log(`  ${severity.toUpperCase()}: ${count} errors`);
        });
        
        if (this.options.verbose) {
          result.errors.slice(0, 10).forEach(error => {
            console.log(`    [${error.severity.toUpperCase()}] ${error.metricName}: ${error.error}`);
          });
          if (result.errors.length > 10) {
            console.log(`    ... and ${result.errors.length - 10} more errors`);
          }
        }
      }

      console.log('\\n⚡ Performance:');
      console.log(`  Average throughput: ${result.averageThroughput.toFixed(2)} records/second`);
      console.log(`  Fastest batch: ${result.performanceMetrics.fastestBatch.throughput.toFixed(2)} records/second`);
      console.log(`  Slowest batch: ${result.performanceMetrics.slowestBatch.throughput.toFixed(2)} records/second`);
      console.log(`  Average batch time: ${(result.performanceMetrics.averageBatchTime / 1000).toFixed(2)} seconds`);
      console.log(`  Error rate: ${result.performanceMetrics.errorRate.toFixed(2)}%`);

      if (result.failedBatches > 0) {
        console.log('\\n⚠️  Some batches failed. Check logs for details.');
        process.exit(1);
      }
      
    } catch (error) {
      monitor.stopMonitoring();
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }

  private async runRollback() {
    if (!this.options.rollbackId) {
      console.error('❌ Rollback ID is required. Use --rollback-id option.');
      process.exit(1);
    }

    console.log(`🔄 Rolling back migration: ${this.options.rollbackId}`);
    
    const success = await migrationService.executeRollback(this.options.rollbackId);
    
    if (success) {
      console.log('✅ Rollback completed successfully');
    } else {
      console.log('❌ Rollback failed');
      process.exit(1);
    }
  }

  private async runValidation() {
    console.log('🔍 Validating current database state...');
    
    // Check conversion consistency
    const totalRecords = await prisma.extractedMetric.count();
    const convertedRecords = await prisma.extractedMetric.count({
      where: { wasConverted: true }
    });
    const unconvertedRecords = totalRecords - convertedRecords;

    console.log('\\n📊 Database State:');
    console.log(`Total records: ${totalRecords}`);
    console.log(`Converted records: ${convertedRecords}`);
    console.log(`Unconverted records: ${unconvertedRecords}`);

    // Check for missing metadata
    const missingMetadata = await prisma.extractedMetric.count({
      where: {
        wasConverted: true,
        OR: [
          { originalValue: null },
          { conversionFactor: null },
          { conversionRule: null }
        ]
      }
    });

    if (missingMetadata > 0) {
      console.log(`⚠️  ${missingMetadata} converted records missing metadata`);
    }

    // Check validation status distribution
    const validationStats = await prisma.extractedMetric.groupBy({
      by: ['validationStatus'],
      _count: true,
      where: { wasConverted: true }
    });

    console.log('\\n🔍 Validation Status:');
    validationStats.forEach((stat: any) => {
      console.log(`  ${stat.validationStatus || 'unknown'}: ${stat._count} records`);
    });

    console.log('\\n✅ Validation complete');
  }

  private createBatchProgressCallback() {
    let lastUpdate = 0;
    
    return (progress: any) => {
      const now = Date.now();
      
      // Update every 5 seconds to avoid spam
      if (now - lastUpdate < 5000) {
        return;
      }
      
      lastUpdate = now;
      
      const percentage = progress.recordsInBatch > 0 ? (progress.recordsProcessed / progress.recordsInBatch * 100).toFixed(1) : '0.0';
      
      console.log(`📦 Batch ${progress.batchNumber}/${progress.totalBatches}: ${progress.recordsProcessed}/${progress.recordsInBatch} (${percentage}%) - Converted: ${progress.recordsConverted}, Errors: ${progress.recordsErrored}`);
      
      if (progress.currentRecord && this.options.verbose) {
        console.log(`   Processing: ${progress.currentRecord.name} = ${progress.currentRecord.value} ${progress.currentRecord.unit}`);
      }
    };
  }

  private createBatchErrorCallback() {
    return (error: any) => {
      if (error.severity === 'critical') {
        console.error(`❌ CRITICAL ERROR in ${error.batchId}: ${error.error}`);
      } else if (this.options.verbose) {
        console.warn(`⚠️  ${error.severity.toUpperCase()}: ${error.metricName} - ${error.error}`);
      }
    };
  }

  private showHelp() {
    console.log(`
Database Unit Conversion Migration CLI

Usage:
  npm run migrate -- <command> [options]

Commands:
  analyze                 Analyze database for conversion needs
  migrate                 Execute migration
  rollback                Rollback migration
  validate                Validate database state

Options:
  --dry-run              Run migration without making changes
  --batch-size <size>    Number of records per batch (default: 100)
  --skip-validation      Skip validation during migration
  --continue-on-error    Continue migration on errors
  --rollback-id <id>     Rollback ID for rollback command
  --verbose              Show detailed output

Examples:
  npm run migrate -- analyze
  npm run migrate -- migrate --dry-run
  npm run migrate -- migrate --batch-size 50
  npm run migrate -- rollback --rollback-id rollback_2024_01_01
  npm run migrate -- validate
    `);
  }
}

// Parse command line arguments
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    command: args[0] as any
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--batch-size':
        options.batchSize = parseInt(args[++i]);
        break;
      case '--skip-validation':
        options.skipValidation = true;
        break;
      case '--continue-on-error':
        options.continueOnError = true;
        break;
      case '--rollback-id':
        options.rollbackId = args[++i];
        break;
      case '--verbose':
        options.verbose = true;
        break;
    }
  }

  return options;
}

// Execute CLI if run directly
if (require.main === module) {
  const options = parseArgs();
  const cli = new MigrationCLI(options);
  cli.execute();
}

export { MigrationCLI, parseArgs };