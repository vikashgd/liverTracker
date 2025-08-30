/**
 * Integration layer between authentication system and monitoring/logging
 * Provides hooks and utilities to automatically log authentication events
 */

import { getAuthLogger, authLogUtils } from './auth-logger';
import { getAuthErrorManager } from './auth-error-manager';

/**
 * Authentication monitoring hooks
 */
export class AuthMonitoringIntegration {
  private logger = getAuthLogger();
  private errorManager = getAuthErrorManager();

  /**
   * Wrap authentication functions with monitoring
   */
  withMonitoring<T extends (...args: any[]) => any>(
    operation: string,
    fn: T,
    options: {
      logSuccess?: boolean;
      logFailure?: boolean;
      logPerformance?: boolean;
      category?: 'auth' | 'security' | 'oauth' | 'session';
    } = {}
  ): T {
    const {
      logSuccess = true,
      logFailure = true,
      logPerformance = true,
      category = 'auth'
    } = options;

    return ((...args: any[]) => {
      const startTime = Date.now();
      const endTiming = logPerformance ? this.logger.startTiming(operation) : null;

      try {
        const result = fn(...args);

        // Handle promises
        if (result && typeof result.then === 'function') {
          return result
            .then((value: any) => {
              if (logSuccess) {
                this.logger.info(category, operation, `${operation} completed successfully`);
              }
              endTiming?.();
              return value;
            })
            .catch((error: any) => {
              if (logFailure) {
                this.logger.error(category, operation, `${operation} failed: ${error.message}`, {
                  error: error.message,
                  stack: error.stack
                });
              }
              endTiming?.();
              throw error;
            });
        }

        // Synchronous result
        if (logSuccess) {
          this.logger.info(category, operation, `${operation} completed successfully`);
        }
        endTiming?.();
        return result;

      } catch (error) {
        if (logFailure) {
          this.logger.error(category, operation, `${operation} failed: ${(error as Error).message}`, {
            error: (error as Error).message,
            stack: (error as Error).stack
          });
        }
        endTiming?.();
        throw error;
      }
    }) as T;
  }

  /**
   * Log authentication attempt
   */
  logAuthAttempt(
    method: 'credentials' | 'oauth' | 'magic-link',
    success: boolean,
    context: {
      userId?: string;
      email?: string;
      provider?: string;
      ipAddress?: string;
      userAgent?: string;
      error?: string;
    }
  ): void {
    const { userId, email, provider, ipAddress, userAgent, error } = context;

    // Log to auth logger
    this.logger.logLoginAttempt(
      userId || email || 'unknown',
      ipAddress || 'unknown',
      userAgent || 'unknown',
      success,
      { method, provider, error }
    );

    // Log specific method details
    if (method === 'oauth' && provider) {
      this.logger.logOAuthEvent(provider, 'signin', success, userId, { error });
    }

    // Create error if failed
    if (!success && error) {
      this.errorManager.createError(error, {
        operation: `${method}_signin`,
        userId,
        ipAddress,
        userAgent
      });
    }
  }

  /**
   * Log session events
   */
  logSessionEvent(
    event: 'created' | 'refreshed' | 'expired' | 'destroyed',
    context: {
      sessionId: string;
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      duration?: number;
    }
  ): void {
    const { sessionId, userId, ipAddress, userAgent, duration } = context;

    this.logger.logSessionEvent(event, sessionId, userId, {
      ipAddress,
      userAgent,
      duration
    });

    // Log logout for destroyed sessions
    if (event === 'destroyed' && userId) {
      this.logger.logLogout(userId, ipAddress || 'unknown', userAgent || 'unknown');
    }
  }

  /**
   * Log password operations
   */
  logPasswordOperation(
    operation: 'reset_request' | 'reset_complete' | 'change',
    context: {
      userId: string;
      email?: string;
      ipAddress?: string;
      userAgent?: string;
      success: boolean;
      error?: string;
    }
  ): void {
    const { userId, email, ipAddress, userAgent, success, error } = context;

    if (operation === 'reset_request' || operation === 'reset_complete') {
      this.logger.logPasswordReset(userId, ipAddress || 'unknown', userAgent || 'unknown', {
        operation,
        email,
        success,
        error
      });
    } else {
      this.logger.info('security', 'password_change', 
        `Password changed for user ${userId}`, {
        userId,
        ipAddress,
        userAgent,
        success,
        error
      });
    }
  }

  /**
   * Log account operations
   */
  logAccountOperation(
    operation: 'created' | 'updated' | 'deleted' | 'locked' | 'unlocked',
    context: {
      userId: string;
      email?: string;
      ipAddress?: string;
      userAgent?: string;
      reason?: string;
      adminUserId?: string;
    }
  ): void {
    const { userId, email, ipAddress, userAgent, reason, adminUserId } = context;

    if (operation === 'locked') {
      this.logger.logAccountLocked(userId, ipAddress || 'unknown', userAgent || 'unknown', reason || 'unknown');
    } else {
      this.logger.info('security', `account_${operation}`, 
        `Account ${operation} for user ${userId}`, {
        userId,
        email,
        ipAddress,
        userAgent,
        reason,
        adminUserId
      });
    }
  }

  /**
   * Log security violations
   */
  logSecurityViolation(
    violation: 'brute_force' | 'suspicious_ip' | 'invalid_token' | 'csrf_attempt',
    context: {
      userId?: string;
      ipAddress: string;
      userAgent?: string;
      details?: Record<string, any>;
    }
  ): void {
    const { userId, ipAddress, userAgent, details } = context;

    this.logger.critical('security', 'security_violation', 
      `Security violation detected: ${violation}`, {
      violation,
      userId,
      ipAddress,
      userAgent,
      details
    });

    // Also log as security event
    this.logger.logSecurityEvent({
      type: 'suspicious_activity',
      userId,
      ipAddress,
      userAgent: userAgent || 'unknown',
      timestamp: Date.now(),
      metadata: { violation, details }
    });
  }

  /**
   * Get monitoring statistics
   */
  getStats(timeRange: '1h' | '24h' | '7d' = '24h'): {
    authAttempts: number;
    successfulLogins: number;
    failedLogins: number;
    errorRate: number;
    averageResponseTime: number;
    securityViolations: number;
  } {
    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };
    
    const since = now - timeRanges[timeRange];

    const logs = this.logger.getLogs({ since, limit: 10000 });
    const securityEvents = this.logger.getSecurityEvents({ since, limit: 10000 });
    const performanceMetrics = this.logger.getPerformanceMetrics({ since, limit: 10000 });

    const authLogs = logs.filter(log => log.category === 'auth');
    const errorLogs = logs.filter(log => log.level === 'ERROR' || log.level === 'CRITICAL');
    
    const successfulLogins = securityEvents.filter(e => e.type === 'login_success').length;
    const failedLogins = securityEvents.filter(e => e.type === 'login_failure').length;
    const authAttempts = successfulLogins + failedLogins;
    
    const securityViolations = securityEvents.filter(e => e.type === 'suspicious_activity').length;
    
    const authMetrics = performanceMetrics.filter(m => 
      m.operation.includes('signin') || m.operation.includes('signup') || m.operation.includes('auth')
    );
    
    const averageResponseTime = authMetrics.length > 0
      ? authMetrics.reduce((sum, m) => sum + m.duration, 0) / authMetrics.length
      : 0;

    const errorRate = authLogs.length > 0 ? errorLogs.length / authLogs.length : 0;

    return {
      authAttempts,
      successfulLogins,
      failedLogins,
      errorRate,
      averageResponseTime,
      securityViolations
    };
  }

  /**
   * Check system health
   */
  checkHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const stats = this.getStats('1h');
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check error rate
    if (stats.errorRate > 0.1) {
      issues.push('High error rate detected');
      recommendations.push('Review recent error logs and fix underlying issues');
    }

    // Check failure rate
    const failureRate = stats.authAttempts > 0 ? stats.failedLogins / stats.authAttempts : 0;
    if (failureRate > 0.3) {
      issues.push('High authentication failure rate');
      recommendations.push('Check for brute force attacks or system issues');
    }

    // Check response time
    if (stats.averageResponseTime > 5000) {
      issues.push('Slow authentication response times');
      recommendations.push('Optimize authentication performance');
    }

    // Check security violations
    if (stats.securityViolations > 0) {
      issues.push('Security violations detected');
      recommendations.push('Review security events and strengthen protection');
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 2 || stats.errorRate > 0.2 || failureRate > 0.5) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    }

    return { status, issues, recommendations };
  }
}

// Global instance
let authMonitoringIntegration: AuthMonitoringIntegration | null = null;

export function getAuthMonitoring(): AuthMonitoringIntegration {
  if (!authMonitoringIntegration) {
    authMonitoringIntegration = new AuthMonitoringIntegration();
  }
  return authMonitoringIntegration;
}

/**
 * Decorator for automatic monitoring of authentication functions
 */
export function withAuthMonitoring(
  operation: string,
  options?: {
    logSuccess?: boolean;
    logFailure?: boolean;
    logPerformance?: boolean;
    category?: 'auth' | 'security' | 'oauth' | 'session';
  }
) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    if (descriptor.value) {
      const monitoring = getAuthMonitoring();
      descriptor.value = monitoring.withMonitoring(operation, descriptor.value, options);
    }
    return descriptor;
  };
}

/**
 * React hook for monitoring authentication operations
 */
export function useAuthMonitoring() {
  const monitoring = getAuthMonitoring();

  return {
    logAuthAttempt: monitoring.logAuthAttempt.bind(monitoring),
    logSessionEvent: monitoring.logSessionEvent.bind(monitoring),
    logPasswordOperation: monitoring.logPasswordOperation.bind(monitoring),
    logAccountOperation: monitoring.logAccountOperation.bind(monitoring),
    logSecurityViolation: monitoring.logSecurityViolation.bind(monitoring),
    getStats: monitoring.getStats.bind(monitoring),
    checkHealth: monitoring.checkHealth.bind(monitoring)
  };
}