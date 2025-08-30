/**
 * Comprehensive authentication logging and monitoring system
 * Provides structured logging, security event tracking, and performance monitoring
 */

export interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
  CRITICAL: 4;
}

export const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

export interface AuthLogEntry {
  id: string;
  timestamp: number;
  level: keyof LogLevel;
  category: 'auth' | 'security' | 'performance' | 'oauth' | 'session' | 'error';
  event: string;
  message: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  duration?: number;
  success?: boolean;
}

export interface SecurityEvent {
  type: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'password_reset' | 'account_locked' | 'suspicious_activity';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  metadata?: Record<string, any>;
}

export class AuthLogger {
  private logs: AuthLogEntry[] = [];
  private securityEvents: SecurityEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private maxLogSize = 1000;
  private currentLogLevel: keyof LogLevel;

  constructor(logLevel: keyof LogLevel = 'INFO') {
    this.currentLogLevel = logLevel;
  }

  /**
   * Log a general authentication event
   */
  log(
    level: keyof LogLevel,
    category: AuthLogEntry['category'],
    event: string,
    message: string,
    context: Partial<Omit<AuthLogEntry, 'id' | 'timestamp' | 'level' | 'category' | 'event' | 'message'>> = {}
  ): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.currentLogLevel]) {
      return; // Skip if below current log level
    }

    const logEntry: AuthLogEntry = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      level,
      category,
      event,
      message,
      ...context
    };

    this.addLogEntry(logEntry);
    this.outputLog(logEntry);
    
    // Send critical logs to monitoring immediately
    if (level === 'CRITICAL' || level === 'ERROR') {
      this.sendToMonitoring(logEntry);
    }
  }

  /**
   * Log security events
   */
  logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.unshift(event);
    
    // Keep security events list manageable
    if (this.securityEvents.length > this.maxLogSize) {
      this.securityEvents = this.securityEvents.slice(0, this.maxLogSize);
    }

    // Log as auth event as well
    this.log('INFO', 'security', event.type, `Security event: ${event.type}`, {
      userId: event.userId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      metadata: event.metadata
    });

    // Check for suspicious patterns
    this.checkSuspiciousActivity(event);
  }

  /**
   * Log performance metrics
   */
  logPerformance(metric: PerformanceMetric): void {
    this.performanceMetrics.unshift(metric);
    
    // Keep metrics list manageable
    if (this.performanceMetrics.length > this.maxLogSize) {
      this.performanceMetrics = this.performanceMetrics.slice(0, this.maxLogSize);
    }

    // Log slow operations
    if (metric.duration > 5000) { // 5 seconds
      this.log('WARN', 'performance', 'slow_operation', 
        `Slow operation detected: ${metric.operation} took ${metric.duration}ms`, {
        duration: metric.duration,
        metadata: metric.metadata
      });
    }

    // Log failed operations
    if (!metric.success) {
      this.log('ERROR', 'performance', 'operation_failed',
        `Operation failed: ${metric.operation}`, {
        duration: metric.duration,
        metadata: metric.metadata
      });
    }
  }

  /**
   * Convenience methods for different log levels
   */
  debug(category: AuthLogEntry['category'], event: string, message: string, context?: any): void {
    this.log('DEBUG', category, event, message, context);
  }

  info(category: AuthLogEntry['category'], event: string, message: string, context?: any): void {
    this.log('INFO', category, event, message, context);
  }

  warn(category: AuthLogEntry['category'], event: string, message: string, context?: any): void {
    this.log('WARN', category, event, message, context);
  }

  error(category: AuthLogEntry['category'], event: string, message: string, context?: any): void {
    this.log('ERROR', category, event, message, context);
  }

  critical(category: AuthLogEntry['category'], event: string, message: string, context?: any): void {
    this.log('CRITICAL', category, event, message, context);
  }

  /**
   * Specific authentication event loggers
   */
  logLoginAttempt(userId: string, ipAddress: string, userAgent: string, success: boolean, metadata?: any): void {
    const eventType = success ? 'login_success' : 'login_failure';
    
    this.logSecurityEvent({
      type: eventType,
      userId,
      ipAddress,
      userAgent,
      timestamp: Date.now(),
      metadata
    });

    this.log(
      success ? 'INFO' : 'WARN',
      'auth',
      eventType,
      `Login ${success ? 'successful' : 'failed'} for user ${userId}`,
      { userId, ipAddress, userAgent, success, metadata }
    );
  }

  logLogout(userId: string, ipAddress: string, userAgent: string, metadata?: any): void {
    this.logSecurityEvent({
      type: 'logout',
      userId,
      ipAddress,
      userAgent,
      timestamp: Date.now(),
      metadata
    });

    this.log('INFO', 'auth', 'logout', `User ${userId} logged out`, {
      userId, ipAddress, userAgent, metadata
    });
  }

  logPasswordReset(userId: string, ipAddress: string, userAgent: string, metadata?: any): void {
    this.logSecurityEvent({
      type: 'password_reset',
      userId,
      ipAddress,
      userAgent,
      timestamp: Date.now(),
      metadata
    });

    this.log('INFO', 'security', 'password_reset', `Password reset for user ${userId}`, {
      userId, ipAddress, userAgent, metadata
    });
  }

  logAccountLocked(userId: string, ipAddress: string, userAgent: string, reason: string): void {
    this.logSecurityEvent({
      type: 'account_locked',
      userId,
      ipAddress,
      userAgent,
      timestamp: Date.now(),
      metadata: { reason }
    });

    this.log('WARN', 'security', 'account_locked', `Account locked for user ${userId}: ${reason}`, {
      userId, ipAddress, userAgent, metadata: { reason }
    });
  }

  logOAuthEvent(provider: string, event: string, success: boolean, userId?: string, metadata?: any): void {
    this.log(
      success ? 'INFO' : 'ERROR',
      'oauth',
      `oauth_${event}`,
      `OAuth ${event} with ${provider} ${success ? 'successful' : 'failed'}`,
      { userId, success, metadata: { provider, ...metadata } }
    );
  }

  logSessionEvent(event: string, sessionId: string, userId?: string, metadata?: any): void {
    this.log('INFO', 'session', event, `Session ${event}`, {
      sessionId, userId, metadata
    });
  }

  /**
   * Performance timing helpers
   */
  startTiming(operation: string): () => void {
    const startTime = Date.now();
    
    return (success: boolean = true, metadata?: any) => {
      const duration = Date.now() - startTime;
      this.logPerformance({
        operation,
        duration,
        timestamp: startTime,
        success,
        metadata
      });
    };
  }

  /**
   * Get logs with filtering
   */
  getLogs(filters: {
    level?: keyof LogLevel;
    category?: AuthLogEntry['category'];
    userId?: string;
    limit?: number;
    since?: number;
  } = {}): AuthLogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters.level) {
      const minLevel = LOG_LEVELS[filters.level];
      filteredLogs = filteredLogs.filter(log => LOG_LEVELS[log.level] >= minLevel);
    }

    if (filters.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filters.category);
    }

    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }

    if (filters.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.since!);
    }

    const limit = filters.limit || 100;
    return filteredLogs.slice(0, limit);
  }

  /**
   * Get security events
   */
  getSecurityEvents(filters: {
    type?: SecurityEvent['type'];
    userId?: string;
    ipAddress?: string;
    limit?: number;
    since?: number;
  } = {}): SecurityEvent[] {
    let filteredEvents = [...this.securityEvents];

    if (filters.type) {
      filteredEvents = filteredEvents.filter(event => event.type === filters.type);
    }

    if (filters.userId) {
      filteredEvents = filteredEvents.filter(event => event.userId === filters.userId);
    }

    if (filters.ipAddress) {
      filteredEvents = filteredEvents.filter(event => event.ipAddress === filters.ipAddress);
    }

    if (filters.since) {
      filteredEvents = filteredEvents.filter(event => event.timestamp >= filters.since!);
    }

    const limit = filters.limit || 100;
    return filteredEvents.slice(0, limit);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(filters: {
    operation?: string;
    success?: boolean;
    limit?: number;
    since?: number;
  } = {}): PerformanceMetric[] {
    let filteredMetrics = [...this.performanceMetrics];

    if (filters.operation) {
      filteredMetrics = filteredMetrics.filter(metric => metric.operation === filters.operation);
    }

    if (filters.success !== undefined) {
      filteredMetrics = filteredMetrics.filter(metric => metric.success === filters.success);
    }

    if (filters.since) {
      filteredMetrics = filteredMetrics.filter(metric => metric.timestamp >= filters.since!);
    }

    const limit = filters.limit || 100;
    return filteredMetrics.slice(0, limit);
  }

  /**
   * Get analytics and statistics
   */
  getAnalytics(): {
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByCategory: Record<string, number>;
    securityEventsByType: Record<string, number>;
    averagePerformance: Record<string, number>;
    recentActivity: {
      logins: number;
      failures: number;
      errors: number;
    };
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    // Count logs by level
    const logsByLevel: Record<string, number> = {};
    this.logs.forEach(log => {
      logsByLevel[log.level] = (logsByLevel[log.level] || 0) + 1;
    });

    // Count logs by category
    const logsByCategory: Record<string, number> = {};
    this.logs.forEach(log => {
      logsByCategory[log.category] = (logsByCategory[log.category] || 0) + 1;
    });

    // Count security events by type
    const securityEventsByType: Record<string, number> = {};
    this.securityEvents.forEach(event => {
      securityEventsByType[event.type] = (securityEventsByType[event.type] || 0) + 1;
    });

    // Calculate average performance by operation
    const performanceByOperation: Record<string, number[]> = {};
    this.performanceMetrics.forEach(metric => {
      if (!performanceByOperation[metric.operation]) {
        performanceByOperation[metric.operation] = [];
      }
      performanceByOperation[metric.operation].push(metric.duration);
    });

    const averagePerformance: Record<string, number> = {};
    Object.entries(performanceByOperation).forEach(([operation, durations]) => {
      averagePerformance[operation] = durations.reduce((a, b) => a + b, 0) / durations.length;
    });

    // Recent activity (last hour)
    const recentLogs = this.logs.filter(log => log.timestamp > oneHourAgo);
    const recentSecurityEvents = this.securityEvents.filter(event => event.timestamp > oneHourAgo);

    const recentActivity = {
      logins: recentSecurityEvents.filter(e => e.type === 'login_success').length,
      failures: recentSecurityEvents.filter(e => e.type === 'login_failure').length,
      errors: recentLogs.filter(l => l.level === 'ERROR' || l.level === 'CRITICAL').length
    };

    return {
      totalLogs: this.logs.length,
      logsByLevel,
      logsByCategory,
      securityEventsByType,
      averagePerformance,
      recentActivity
    };
  }

  /**
   * Clear logs (for maintenance)
   */
  clearLogs(): void {
    this.logs = [];
    this.securityEvents = [];
    this.performanceMetrics = [];
  }

  /**
   * Set log level
   */
  setLogLevel(level: keyof LogLevel): void {
    this.currentLogLevel = level;
  }

  /**
   * Private helper methods
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addLogEntry(entry: AuthLogEntry): void {
    this.logs.unshift(entry);
    
    // Keep logs list manageable
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(0, this.maxLogSize);
    }
  }

  private outputLog(entry: AuthLogEntry): void {
    if (typeof window === 'undefined') {
      // Server-side logging
      const logMessage = `[${entry.level}] ${entry.category}:${entry.event} - ${entry.message}`;
      
      switch (entry.level) {
        case 'DEBUG':
          console.debug(logMessage, entry.metadata);
          break;
        case 'INFO':
          console.info(logMessage, entry.metadata);
          break;
        case 'WARN':
          console.warn(logMessage, entry.metadata);
          break;
        case 'ERROR':
        case 'CRITICAL':
          console.error(logMessage, entry.metadata);
          break;
      }
    } else {
      // Client-side logging (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${entry.level}] ${entry.category}:${entry.event}`, entry);
      }
    }
  }

  private async sendToMonitoring(entry: AuthLogEntry): Promise<void> {
    if (typeof window === 'undefined') return; // Server-side only

    try {
      await fetch('/api/monitoring/auth-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            code: entry.event,
            message: entry.message,
            userMessage: entry.message,
            severity: entry.level.toLowerCase(),
            category: entry.category
          },
          context: {
            operation: entry.event,
            timestamp: entry.timestamp,
            userId: entry.userId,
            sessionId: entry.sessionId,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            additionalData: entry.metadata
          }
        })
      });
    } catch (error) {
      console.error('Failed to send log to monitoring:', error);
    }
  }

  private checkSuspiciousActivity(event: SecurityEvent): void {
    // Check for multiple failed logins from same IP
    if (event.type === 'login_failure') {
      const recentFailures = this.securityEvents.filter(e => 
        e.type === 'login_failure' && 
        e.ipAddress === event.ipAddress &&
        e.timestamp > (Date.now() - 15 * 60 * 1000) // Last 15 minutes
      );

      if (recentFailures.length >= 5) {
        this.logSecurityEvent({
          type: 'suspicious_activity',
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          timestamp: Date.now(),
          metadata: {
            reason: 'multiple_failed_logins',
            count: recentFailures.length,
            timeWindow: '15_minutes'
          }
        });
      }
    }

    // Check for logins from multiple IPs for same user
    if (event.type === 'login_success' && event.userId) {
      const recentLogins = this.securityEvents.filter(e =>
        e.type === 'login_success' &&
        e.userId === event.userId &&
        e.timestamp > (Date.now() - 60 * 60 * 1000) // Last hour
      );

      const uniqueIPs = new Set(recentLogins.map(e => e.ipAddress));
      
      if (uniqueIPs.size >= 3) {
        this.logSecurityEvent({
          type: 'suspicious_activity',
          userId: event.userId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          timestamp: Date.now(),
          metadata: {
            reason: 'multiple_ip_logins',
            ipCount: uniqueIPs.size,
            ips: Array.from(uniqueIPs),
            timeWindow: '1_hour'
          }
        });
      }
    }
  }
}

// Global logger instance
let authLogger: AuthLogger | null = null;

export function getAuthLogger(): AuthLogger {
  if (!authLogger) {
    const logLevel = (process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO') as keyof LogLevel;
    authLogger = new AuthLogger(logLevel);
  }
  return authLogger;
}

/**
 * Utility functions for common logging scenarios
 */
export const authLogUtils = {
  /**
   * Create a timing decorator for functions
   */
  withTiming: <T extends (...args: any[]) => any>(
    operation: string,
    fn: T
  ): T => {
    return ((...args: any[]) => {
      const logger = getAuthLogger();
      const endTiming = logger.startTiming(operation);
      
      try {
        const result = fn(...args);
        
        // Handle promises
        if (result && typeof result.then === 'function') {
          return result
            .then((value: any) => {
              endTiming();
              return value;
            })
            .catch((error: any) => {
              endTiming();
              throw error;
            });
        }
        
        endTiming();
        return result;
      } catch (error) {
        endTiming();
        throw error;
      }
    }) as T;
  },

  /**
   * Log request context from Next.js request
   */
  getRequestContext: (request: Request): {
    ipAddress: string;
    userAgent: string;
  } => {
    const headers = request.headers;
    
    return {
      ipAddress: headers.get('x-forwarded-for') || 
                headers.get('x-real-ip') || 
                'unknown',
      userAgent: headers.get('user-agent') || 'unknown'
    };
  }
};