/**
 * Migration Monitoring System
 * Real-time monitoring and alerting for database migration
 */

import { EventEmitter } from 'events';
import type { BatchProgress, BatchError, ExecutionSummary } from './batch-executor';

export interface MonitoringConfig {
  alertThresholds: {
    errorRate: number; // Percentage
    slowBatchThreshold: number; // Seconds
    memoryUsageThreshold: number; // MB
    diskSpaceThreshold: number; // GB
  };
  reportingInterval: number; // Seconds
  enableAlerts: boolean;
  enablePerformanceTracking: boolean;
}

export interface PerformanceMetrics {
  timestamp: Date;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  diskSpace: {
    used: number;
    available: number;
    percentage: number;
  };
  databaseConnections: {
    active: number;
    idle: number;
    total: number;
  };
  throughput: {
    recordsPerSecond: number;
    batchesPerMinute: number;
  };
}

export interface Alert {
  id: string;
  type: 'error_rate' | 'performance' | 'resource' | 'batch_failure';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details: any;
  timestamp: Date;
  acknowledged: boolean;
}

export interface MonitoringReport {
  timestamp: Date;
  overallStatus: 'healthy' | 'warning' | 'critical';
  currentBatches: BatchProgress[];
  completedBatches: number;
  totalErrors: number;
  errorRate: number;
  averageThroughput: number;
  performanceMetrics: PerformanceMetrics;
  activeAlerts: Alert[];
  recommendations: string[];
}

export class MigrationMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private performanceHistory: PerformanceMetrics[] = [];
  private activeAlerts: Map<string, Alert> = new Map();
  private alertCounter: number = 0;

  constructor(config: Partial<MonitoringConfig> = {}) {
    super();
    
    this.config = {
      alertThresholds: {
        errorRate: 5.0, // 5% error rate
        slowBatchThreshold: 300, // 5 minutes
        memoryUsageThreshold: 1024, // 1GB
        diskSpaceThreshold: 5 // 5GB free space
      },
      reportingInterval: 30, // 30 seconds
      enableAlerts: true,
      enablePerformanceTracking: true,
      ...config
    };
  }

  /**
   * Start monitoring migration process
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('⚠️ Monitoring is already active');
      return;
    }

    this.isMonitoring = true;
    console.log('📊 Starting migration monitoring...');

    // Start periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.performMonitoringCycle();
    }, this.config.reportingInterval * 1000);

    // Initial monitoring cycle
    this.performMonitoringCycle();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    console.log('📊 Migration monitoring stopped');
  }

  /**
   * Handle batch progress update
   */
  onBatchProgress(progress: BatchProgress): void {
    this.emit('batchProgress', progress);
    
    // Check for slow batch alert
    if (this.config.enableAlerts) {
      const batchDuration = Date.now() - progress.startTime.getTime();
      if (batchDuration > this.config.alertThresholds.slowBatchThreshold * 1000) {
        this.createAlert(
          'performance',
          'warning',
          `Batch ${progress.batchId} is running slowly`,
          {
            batchId: progress.batchId,
            duration: batchDuration,
            threshold: this.config.alertThresholds.slowBatchThreshold
          }
        );
      }
    }
  }

  /**
   * Handle batch error
   */
  onBatchError(error: BatchError): void {
    this.emit('batchError', error);
    
    if (this.config.enableAlerts && error.severity === 'critical') {
      this.createAlert(
        'batch_failure',
        'critical',
        `Critical error in batch ${error.batchId}`,
        error
      );
    }
  }

  /**
   * Handle execution completion
   */
  onExecutionComplete(summary: ExecutionSummary): void {
    this.emit('executionComplete', summary);
    
    // Generate completion report
    const report = this.generateCompletionReport(summary);
    this.emit('completionReport', report);
    
    console.log('✅ Migration execution completed - monitoring report generated');
  }

  /**
   * Perform monitoring cycle
   */
  private async performMonitoringCycle(): Promise<void> {
    try {
      // Collect performance metrics
      const performanceMetrics = await this.collectPerformanceMetrics();
      this.performanceHistory.push(performanceMetrics);
      
      // Keep only last 100 entries
      if (this.performanceHistory.length > 100) {
        this.performanceHistory = this.performanceHistory.slice(-100);
      }

      // Check for resource alerts
      if (this.config.enableAlerts) {
        this.checkResourceAlerts(performanceMetrics);
      }

      // Generate monitoring report
      const report = await this.generateMonitoringReport(performanceMetrics);
      this.emit('monitoringReport', report);

    } catch (error) {
      console.error('❌ Monitoring cycle failed:', error);
      
      if (this.config.enableAlerts) {
        this.createAlert(
          'error_rate',
          'warning',
          'Monitoring system error',
          { error: error instanceof Error ? error.message : String(error) }
        );
      }
    }
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    // In a real implementation, these would collect actual system metrics
    // For now, we'll simulate the metrics
    
    const memoryUsage = process.memoryUsage();
    const memoryUsed = memoryUsage.heapUsed / 1024 / 1024; // MB
    const memoryTotal = memoryUsage.heapTotal / 1024 / 1024; // MB
    
    return {
      timestamp: new Date(),
      memoryUsage: {
        used: memoryUsed,
        total: memoryTotal,
        percentage: (memoryUsed / memoryTotal) * 100
      },
      cpuUsage: this.simulateCpuUsage(),
      diskSpace: {
        used: 50000, // Simulated 50GB used
        available: 100000, // Simulated 100GB available
        percentage: 50
      },
      databaseConnections: {
        active: 5,
        idle: 10,
        total: 15
      },
      throughput: {
        recordsPerSecond: this.calculateCurrentThroughput(),
        batchesPerMinute: this.calculateBatchesPerMinute()
      }
    };
  }

  /**
   * Check for resource-based alerts
   */
  private checkResourceAlerts(metrics: PerformanceMetrics): void {
    // Memory usage alert
    if (metrics.memoryUsage.used > this.config.alertThresholds.memoryUsageThreshold) {
      this.createAlert(
        'resource',
        'warning',
        `High memory usage: ${metrics.memoryUsage.used.toFixed(1)}MB`,
        { memoryUsage: metrics.memoryUsage }
      );
    }

    // Disk space alert
    if (metrics.diskSpace.available < this.config.alertThresholds.diskSpaceThreshold * 1024) {
      this.createAlert(
        'resource',
        'critical',
        `Low disk space: ${(metrics.diskSpace.available / 1024).toFixed(1)}GB remaining`,
        { diskSpace: metrics.diskSpace }
      );
    }

    // Performance alert
    if (metrics.throughput.recordsPerSecond < 10) {
      this.createAlert(
        'performance',
        'warning',
        `Low throughput: ${metrics.throughput.recordsPerSecond.toFixed(1)} records/sec`,
        { throughput: metrics.throughput }
      );
    }
  }

  /**
   * Create alert
   */
  private createAlert(
    type: Alert['type'],
    severity: Alert['severity'],
    message: string,
    details: any
  ): void {
    const alertId = `alert_${++this.alertCounter}_${Date.now()}`;
    
    const alert: Alert = {
      id: alertId,
      type,
      severity,
      message,
      details,
      timestamp: new Date(),
      acknowledged: false
    };

    this.activeAlerts.set(alertId, alert);
    this.emit('alert', alert);
    
    console.log(`🚨 ${severity.toUpperCase()} ALERT: ${message}`);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alertAcknowledged', alert);
      return true;
    }
    return false;
  }

  /**
   * Clear acknowledged alerts
   */
  clearAcknowledgedAlerts(): number {
    let cleared = 0;
    for (const [id, alert] of this.activeAlerts.entries()) {
      if (alert.acknowledged) {
        this.activeAlerts.delete(id);
        cleared++;
      }
    }
    return cleared;
  }

  /**
   * Generate monitoring report
   */
  private async generateMonitoringReport(
    performanceMetrics: PerformanceMetrics
  ): Promise<MonitoringReport> {
    // This would typically get current status from the batch executor
    // For now, we'll simulate the data
    
    const activeAlerts = Array.from(this.activeAlerts.values())
      .filter(alert => !alert.acknowledged);
    
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
    const warningAlerts = activeAlerts.filter(alert => alert.severity === 'warning');
    
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalAlerts.length > 0) {
      overallStatus = 'critical';
    } else if (warningAlerts.length > 0) {
      overallStatus = 'warning';
    }

    const recommendations: string[] = [];
    
    // Generate recommendations based on current state
    if (performanceMetrics.memoryUsage.percentage > 80) {
      recommendations.push('Consider reducing batch size to lower memory usage');
    }
    
    if (performanceMetrics.throughput.recordsPerSecond < 20) {
      recommendations.push('Performance is below optimal - check database connections and system resources');
    }
    
    if (activeAlerts.length > 5) {
      recommendations.push('Multiple alerts active - review system health and consider pausing migration');
    }

    return {
      timestamp: new Date(),
      overallStatus,
      currentBatches: [], // Would be populated from batch executor
      completedBatches: 0, // Would be populated from batch executor
      totalErrors: 0, // Would be populated from batch executor
      errorRate: 0, // Would be calculated from actual data
      averageThroughput: performanceMetrics.throughput.recordsPerSecond,
      performanceMetrics,
      activeAlerts,
      recommendations
    };
  }

  /**
   * Generate completion report
   */
  private generateCompletionReport(summary: ExecutionSummary): string {
    let report = '# Migration Execution Report\\n\\n';
    report += `**Completion Time**: ${new Date().toISOString()}\\n`;
    report += `**Total Duration**: ${Math.ceil(summary.totalDuration / 1000 / 60)} minutes\\n\\n`;

    report += '## Summary\\n\\n';
    report += `- **Total Batches**: ${summary.totalBatches}\\n`;
    report += `- **Successful Batches**: ${summary.successfulBatches}\\n`;
    report += `- **Failed Batches**: ${summary.failedBatches}\\n`;
    report += `- **Records Processed**: ${summary.totalRecordsProcessed.toLocaleString()}\\n`;
    report += `- **Records Converted**: ${summary.totalRecordsConverted.toLocaleString()}\\n`;
    report += `- **Records Skipped**: ${summary.totalRecordsSkipped.toLocaleString()}\\n`;
    report += `- **Records Errored**: ${summary.totalRecordsErrored.toLocaleString()}\\n`;
    report += `- **Average Throughput**: ${summary.averageThroughput.toFixed(1)} records/sec\\n\\n`;

    report += '## Performance Metrics\\n\\n';
    report += `- **Fastest Batch**: ${summary.performanceMetrics.fastestBatch.throughput.toFixed(1)} records/sec\\n`;
    report += `- **Slowest Batch**: ${summary.performanceMetrics.slowestBatch.throughput.toFixed(1)} records/sec\\n`;
    report += `- **Average Batch Time**: ${(summary.performanceMetrics.averageBatchTime / 1000).toFixed(1)} seconds\\n`;
    report += `- **Error Rate**: ${summary.performanceMetrics.errorRate.toFixed(2)}%\\n\\n`;

    if (summary.errors.length > 0) {
      report += '## Errors\\n\\n';
      const errorsByType = summary.errors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      Object.entries(errorsByType).forEach(([severity, count]) => {
        report += `- **${severity.toUpperCase()}**: ${count} errors\\n`;
      });
    }

    return report;
  }

  // Helper methods
  private simulateCpuUsage(): number {
    // Simulate CPU usage between 20-80%
    return 20 + Math.random() * 60;
  }

  private calculateCurrentThroughput(): number {
    // Calculate based on recent performance history
    if (this.performanceHistory.length < 2) {
      return 50; // Default value
    }
    
    const recent = this.performanceHistory.slice(-5);
    return recent.reduce((sum, metrics) => sum + metrics.throughput.recordsPerSecond, 0) / recent.length;
  }

  private calculateBatchesPerMinute(): number {
    // Simulate batches per minute
    return Math.random() * 10 + 5;
  }

  /**
   * Get monitoring statistics
   */
  getStatistics(): {
    isMonitoring: boolean;
    performanceHistoryLength: number;
    activeAlertsCount: number;
    acknowledgedAlertsCount: number;
    monitoringDuration: number;
  } {
    const acknowledgedAlerts = Array.from(this.activeAlerts.values())
      .filter(alert => alert.acknowledged).length;
    
    return {
      isMonitoring: this.isMonitoring,
      performanceHistoryLength: this.performanceHistory.length,
      activeAlertsCount: this.activeAlerts.size - acknowledgedAlerts,
      acknowledgedAlertsCount: acknowledgedAlerts,
      monitoringDuration: this.performanceHistory.length * this.config.reportingInterval
    };
  }
}

/**
 * Utility function to create and start monitoring
 */
export function createMigrationMonitor(config?: Partial<MonitoringConfig>): MigrationMonitor {
  return new MigrationMonitor(config);
}