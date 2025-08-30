import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  AuthLogger,
  getAuthLogger,
  authLogUtils,
  LOG_LEVELS
} from '../auth-logger';

// Mock fetch for monitoring
global.fetch = vi.fn();

describe('AuthLogger', () => {
  let logger: AuthLogger;

  beforeEach(() => {
    logger = new AuthLogger('DEBUG');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic logging', () => {
    it('should log messages at appropriate levels', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      logger.info('auth', 'test_event', 'Test message');
      
      const logs = logger.getLogs({ limit: 1 });
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('INFO');
      expect(logs[0].category).toBe('auth');
      expect(logs[0].event).toBe('test_event');
      expect(logs[0].message).toBe('Test message');
      
      consoleSpy.mockRestore();
    });

    it('should respect log level filtering', () => {
      const warnLogger = new AuthLogger('WARN');
      
      warnLogger.debug('auth', 'debug_event', 'Debug message');
      warnLogger.info('auth', 'info_event', 'Info message');
      warnLogger.warn('auth', 'warn_event', 'Warn message');
      
      const logs = warnLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('WARN');
    });

    it('should generate unique log IDs', () => {
      logger.info('auth', 'event1', 'Message 1');
      logger.info('auth', 'event2', 'Message 2');
      
      const logs = logger.getLogs({ limit: 2 });
      expect(logs[0].id).not.toBe(logs[1].id);
      expect(logs[0].id).toMatch(/^log_\d+_[a-z0-9]+$/);
    });

    it('should include timestamps', () => {
      const beforeLog = Date.now();
      logger.info('auth', 'test_event', 'Test message');
      const afterLog = Date.now();
      
      const logs = logger.getLogs({ limit: 1 });
      expect(logs[0].timestamp).toBeGreaterThanOrEqual(beforeLog);
      expect(logs[0].timestamp).toBeLessThanOrEqual(afterLog);
    });
  });

  describe('convenience methods', () => {
    it('should provide debug method', () => {
      logger.debug('auth', 'debug_event', 'Debug message');
      
      const logs = logger.getLogs({ level: 'DEBUG', limit: 1 });
      expect(logs[0].level).toBe('DEBUG');
    });

    it('should provide info method', () => {
      logger.info('auth', 'info_event', 'Info message');
      
      const logs = logger.getLogs({ level: 'INFO', limit: 1 });
      expect(logs[0].level).toBe('INFO');
    });

    it('should provide warn method', () => {
      logger.warn('auth', 'warn_event', 'Warn message');
      
      const logs = logger.getLogs({ level: 'WARN', limit: 1 });
      expect(logs[0].level).toBe('WARN');
    });

    it('should provide error method', () => {
      logger.error('auth', 'error_event', 'Error message');
      
      const logs = logger.getLogs({ level: 'ERROR', limit: 1 });
      expect(logs[0].level).toBe('ERROR');
    });

    it('should provide critical method', () => {
      logger.critical('auth', 'critical_event', 'Critical message');
      
      const logs = logger.getLogs({ level: 'CRITICAL', limit: 1 });
      expect(logs[0].level).toBe('CRITICAL');
    });
  });

  describe('security event logging', () => {
    it('should log login attempts', () => {
      logger.logLoginAttempt('user-123', '192.168.1.1', 'Mozilla/5.0', true, { method: 'credentials' });
      
      const securityEvents = logger.getSecurityEvents({ limit: 1 });
      expect(securityEvents).toHaveLength(1);
      expect(securityEvents[0].type).toBe('login_success');
      expect(securityEvents[0].userId).toBe('user-123');
      expect(securityEvents[0].ipAddress).toBe('192.168.1.1');
    });

    it('should log failed login attempts', () => {
      logger.logLoginAttempt('user-123', '192.168.1.1', 'Mozilla/5.0', false);
      
      const securityEvents = logger.getSecurityEvents({ limit: 1 });
      expect(securityEvents[0].type).toBe('login_failure');
    });

    it('should log logout events', () => {
      logger.logLogout('user-123', '192.168.1.1', 'Mozilla/5.0');
      
      const securityEvents = logger.getSecurityEvents({ limit: 1 });
      expect(securityEvents[0].type).toBe('logout');
    });

    it('should log password reset events', () => {
      logger.logPasswordReset('user-123', '192.168.1.1', 'Mozilla/5.0');
      
      const securityEvents = logger.getSecurityEvents({ limit: 1 });
      expect(securityEvents[0].type).toBe('password_reset');
    });

    it('should log account locked events', () => {
      logger.logAccountLocked('user-123', '192.168.1.1', 'Mozilla/5.0', 'Too many failed attempts');
      
      const securityEvents = logger.getSecurityEvents({ limit: 1 });
      expect(securityEvents[0].type).toBe('account_locked');
      expect(securityEvents[0].metadata?.reason).toBe('Too many failed attempts');
    });
  });

  describe('OAuth event logging', () => {
    it('should log successful OAuth events', () => {
      logger.logOAuthEvent('google', 'signin', true, 'user-123');
      
      const logs = logger.getLogs({ category: 'oauth', limit: 1 });
      expect(logs[0].event).toBe('oauth_signin');
      expect(logs[0].level).toBe('INFO');
      expect(logs[0].success).toBe(true);
    });

    it('should log failed OAuth events', () => {
      logger.logOAuthEvent('google', 'signin', false, undefined, { error: 'Access denied' });
      
      const logs = logger.getLogs({ category: 'oauth', limit: 1 });
      expect(logs[0].level).toBe('ERROR');
      expect(logs[0].success).toBe(false);
    });
  });

  describe('session event logging', () => {
    it('should log session events', () => {
      logger.logSessionEvent('created', 'session-123', 'user-123');
      
      const logs = logger.getLogs({ category: 'session', limit: 1 });
      expect(logs[0].event).toBe('created');
      expect(logs[0].sessionId).toBe('session-123');
      expect(logs[0].userId).toBe('user-123');
    });
  });

  describe('performance logging', () => {
    it('should log performance metrics', () => {
      logger.logPerformance({
        operation: 'signin',
        duration: 1500,
        timestamp: Date.now(),
        success: true
      });
      
      const metrics = logger.getPerformanceMetrics({ limit: 1 });
      expect(metrics[0].operation).toBe('signin');
      expect(metrics[0].duration).toBe(1500);
      expect(metrics[0].success).toBe(true);
    });

    it('should log slow operations as warnings', () => {
      logger.logPerformance({
        operation: 'slow_signin',
        duration: 6000, // 6 seconds
        timestamp: Date.now(),
        success: true
      });
      
      const logs = logger.getLogs({ category: 'performance', level: 'WARN', limit: 1 });
      expect(logs[0].event).toBe('slow_operation');
    });

    it('should log failed operations as errors', () => {
      logger.logPerformance({
        operation: 'failed_signin',
        duration: 1000,
        timestamp: Date.now(),
        success: false
      });
      
      const logs = logger.getLogs({ category: 'performance', level: 'ERROR', limit: 1 });
      expect(logs[0].event).toBe('operation_failed');
    });
  });

  describe('timing utilities', () => {
    it('should provide timing functionality', async () => {
      const endTiming = logger.startTiming('test_operation');
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));
      
      endTiming(true);
      
      const metrics = logger.getPerformanceMetrics({ operation: 'test_operation', limit: 1 });
      expect(metrics[0].operation).toBe('test_operation');
      expect(metrics[0].duration).toBeGreaterThan(0);
      expect(metrics[0].success).toBe(true);
    });

    it('should handle timing failures', () => {
      const endTiming = logger.startTiming('failed_operation');
      
      endTiming(false, { error: 'Operation failed' });
      
      const metrics = logger.getPerformanceMetrics({ operation: 'failed_operation', limit: 1 });
      expect(metrics[0].success).toBe(false);
      expect(metrics[0].metadata?.error).toBe('Operation failed');
    });
  });

  describe('filtering and querying', () => {
    beforeEach(() => {
      // Add test data
      logger.info('auth', 'signin', 'User signed in', { userId: 'user-1' });
      logger.warn('security', 'failed_attempt', 'Failed login', { userId: 'user-2' });
      logger.error('network', 'connection_failed', 'Network error');
    });

    it('should filter logs by level', () => {
      const errorLogs = logger.getLogs({ level: 'ERROR' });
      expect(errorLogs.every(log => LOG_LEVELS[log.level] >= LOG_LEVELS.ERROR)).toBe(true);
    });

    it('should filter logs by category', () => {
      const authLogs = logger.getLogs({ category: 'auth' });
      expect(authLogs.every(log => log.category === 'auth')).toBe(true);
    });

    it('should filter logs by userId', () => {
      const userLogs = logger.getLogs({ userId: 'user-1' });
      expect(userLogs.every(log => log.userId === 'user-1')).toBe(true);
    });

    it('should filter logs by time range', () => {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const recentLogs = logger.getLogs({ since: oneHourAgo });
      expect(recentLogs.every(log => log.timestamp >= oneHourAgo)).toBe(true);
    });

    it('should limit log results', () => {
      const limitedLogs = logger.getLogs({ limit: 2 });
      expect(limitedLogs).toHaveLength(2);
    });
  });

  describe('analytics and statistics', () => {
    beforeEach(() => {
      // Add test data
      logger.info('auth', 'signin', 'User signed in');
      logger.warn('security', 'failed_attempt', 'Failed login');
      logger.error('network', 'connection_failed', 'Network error');
      logger.logLoginAttempt('user-1', '192.168.1.1', 'Mozilla/5.0', true);
      logger.logLoginAttempt('user-2', '192.168.1.2', 'Mozilla/5.0', false);
    });

    it('should generate analytics', () => {
      const analytics = logger.getAnalytics();
      
      expect(analytics.totalLogs).toBeGreaterThan(0);
      expect(analytics.logsByLevel).toBeDefined();
      expect(analytics.logsByCategory).toBeDefined();
      expect(analytics.securityEventsByType).toBeDefined();
      expect(analytics.recentActivity).toBeDefined();
    });

    it('should count logs by level', () => {
      const analytics = logger.getAnalytics();
      
      expect(analytics.logsByLevel.INFO).toBeGreaterThan(0);
      expect(analytics.logsByLevel.WARN).toBeGreaterThan(0);
      expect(analytics.logsByLevel.ERROR).toBeGreaterThan(0);
    });

    it('should count logs by category', () => {
      const analytics = logger.getAnalytics();
      
      expect(analytics.logsByCategory.auth).toBeGreaterThan(0);
      expect(analytics.logsByCategory.security).toBeGreaterThan(0);
      expect(analytics.logsByCategory.network).toBeGreaterThan(0);
    });

    it('should track recent activity', () => {
      const analytics = logger.getAnalytics();
      
      expect(analytics.recentActivity.logins).toBeGreaterThanOrEqual(0);
      expect(analytics.recentActivity.failures).toBeGreaterThanOrEqual(0);
      expect(analytics.recentActivity.errors).toBeGreaterThanOrEqual(0);
    });
  });

  describe('suspicious activity detection', () => {
    it('should detect multiple failed logins from same IP', () => {
      const ip = '192.168.1.100';
      
      // Generate multiple failed logins
      for (let i = 0; i < 6; i++) {
        logger.logLoginAttempt(`user-${i}`, ip, 'Mozilla/5.0', false);
      }
      
      const suspiciousEvents = logger.getSecurityEvents({ type: 'suspicious_activity' });
      expect(suspiciousEvents.length).toBeGreaterThan(0);
      expect(suspiciousEvents[0].metadata?.reason).toBe('multiple_failed_logins');
    });

    it('should detect logins from multiple IPs for same user', () => {
      const userId = 'user-123';
      const ips = ['192.168.1.1', '10.0.0.1', '172.16.0.1'];
      
      // Generate logins from different IPs
      ips.forEach(ip => {
        logger.logLoginAttempt(userId, ip, 'Mozilla/5.0', true);
      });
      
      const suspiciousEvents = logger.getSecurityEvents({ type: 'suspicious_activity' });
      expect(suspiciousEvents.some(e => e.metadata?.reason === 'multiple_ip_logins')).toBe(true);
    });
  });

  describe('log management', () => {
    it('should maintain maximum log size', () => {
      const smallLogger = new AuthLogger('DEBUG');
      
      // Generate more logs than the limit
      for (let i = 0; i < 1500; i++) {
        smallLogger.info('auth', 'test_event', `Message ${i}`);
      }
      
      const logs = smallLogger.getLogs({ limit: 2000 });
      expect(logs.length).toBeLessThanOrEqual(1000); // Default max size
    });

    it('should clear logs', () => {
      logger.info('auth', 'test_event', 'Test message');
      expect(logger.getLogs()).toHaveLength(1);
      
      logger.clearLogs();
      expect(logger.getLogs()).toHaveLength(0);
    });

    it('should set log level', () => {
      logger.setLogLevel('ERROR');
      
      logger.debug('auth', 'debug_event', 'Debug message');
      logger.info('auth', 'info_event', 'Info message');
      logger.error('auth', 'error_event', 'Error message');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('ERROR');
    });
  });
});

describe('authLogUtils', () => {
  describe('withTiming', () => {
    it('should time synchronous functions', () => {
      const logger = new AuthLogger('DEBUG');
      
      const timedFunction = authLogUtils.withTiming('test_sync', (x: number, y: number) => x + y);
      
      const result = timedFunction(2, 3);
      expect(result).toBe(5);
      
      const metrics = logger.getPerformanceMetrics({ operation: 'test_sync', limit: 1 });
      expect(metrics[0].operation).toBe('test_sync');
      expect(metrics[0].success).toBe(true);
    });

    it('should time asynchronous functions', async () => {
      const logger = new AuthLogger('DEBUG');
      
      const timedAsyncFunction = authLogUtils.withTiming('test_async', async (delay: number) => {
        await new Promise(resolve => setTimeout(resolve, delay));
        return 'done';
      });
      
      const result = await timedAsyncFunction(10);
      expect(result).toBe('done');
      
      const metrics = logger.getPerformanceMetrics({ operation: 'test_async', limit: 1 });
      expect(metrics[0].operation).toBe('test_async');
      expect(metrics[0].success).toBe(true);
      expect(metrics[0].duration).toBeGreaterThan(0);
    });

    it('should handle function errors', () => {
      const logger = new AuthLogger('DEBUG');
      
      const timedFunction = authLogUtils.withTiming('test_error', () => {
        throw new Error('Test error');
      });
      
      expect(() => timedFunction()).toThrow('Test error');
      
      const metrics = logger.getPerformanceMetrics({ operation: 'test_error', limit: 1 });
      expect(metrics[0].success).toBe(false);
      expect(metrics[0].metadata?.error).toBe('Test error');
    });

    it('should handle async function errors', async () => {
      const logger = new AuthLogger('DEBUG');
      
      const timedAsyncFunction = authLogUtils.withTiming('test_async_error', async () => {
        throw new Error('Async test error');
      });
      
      await expect(timedAsyncFunction()).rejects.toThrow('Async test error');
      
      const metrics = logger.getPerformanceMetrics({ operation: 'test_async_error', limit: 1 });
      expect(metrics[0].success).toBe(false);
      expect(metrics[0].metadata?.error).toBe('Async test error');
    });
  });

  describe('getRequestContext', () => {
    it('should extract request context', () => {
      const mockRequest = {
        headers: new Map([
          ['x-forwarded-for', '192.168.1.1'],
          ['user-agent', 'Mozilla/5.0 (Test Browser)']
        ])
      } as any;
      
      mockRequest.headers.get = (key: string) => mockRequest.headers.get(key);
      
      const context = authLogUtils.getRequestContext(mockRequest);
      
      expect(context.ipAddress).toBe('192.168.1.1');
      expect(context.userAgent).toBe('Mozilla/5.0 (Test Browser)');
    });

    it('should handle missing headers', () => {
      const mockRequest = {
        headers: new Map()
      } as any;
      
      mockRequest.headers.get = () => null;
      
      const context = authLogUtils.getRequestContext(mockRequest);
      
      expect(context.ipAddress).toBe('unknown');
      expect(context.userAgent).toBe('unknown');
    });
  });
});

describe('getAuthLogger', () => {
  it('should return singleton instance', () => {
    const logger1 = getAuthLogger();
    const logger2 = getAuthLogger();
    
    expect(logger1).toBe(logger2);
  });

  it('should return AuthLogger instance', () => {
    const logger = getAuthLogger();
    
    expect(logger).toBeInstanceOf(AuthLogger);
  });
});

describe('LOG_LEVELS constants', () => {
  it('should have correct log level hierarchy', () => {
    expect(LOG_LEVELS.DEBUG).toBe(0);
    expect(LOG_LEVELS.INFO).toBe(1);
    expect(LOG_LEVELS.WARN).toBe(2);
    expect(LOG_LEVELS.ERROR).toBe(3);
    expect(LOG_LEVELS.CRITICAL).toBe(4);
  });
});