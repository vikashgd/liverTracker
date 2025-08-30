import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { getAuthLogger } from '@/lib/auth-logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check admin access
    const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const logger = getAuthLogger();
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const timeRange = searchParams.get('timeRange') || '24h';
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');

    // Calculate time range
    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const since = now - (timeRanges[timeRange as keyof typeof timeRanges] || timeRanges['24h']);

    // Get filtered data
    const logs = logger.getLogs({
      category: category as any,
      userId: userId || undefined,
      since,
      limit: 1000
    });

    const securityEvents = logger.getSecurityEvents({
      userId: userId || undefined,
      since,
      limit: 1000
    });

    const performanceMetrics = logger.getPerformanceMetrics({
      since,
      limit: 1000
    });

    // Get analytics
    const analytics = logger.getAnalytics();

    // Calculate additional metrics
    const dashboardData = {
      overview: {
        totalLogs: logs.length,
        totalSecurityEvents: securityEvents.length,
        totalPerformanceMetrics: performanceMetrics.length,
        timeRange,
        lastUpdated: new Date().toISOString()
      },
      
      logSummary: {
        byLevel: analytics.logsByLevel,
        byCategory: analytics.logsByCategory,
        recentActivity: analytics.recentActivity
      },
      
      securitySummary: {
        eventsByType: analytics.securityEventsByType,
        recentLogins: securityEvents.filter(e => e.type === 'login_success').length,
        recentFailures: securityEvents.filter(e => e.type === 'login_failure').length,
        accountsLocked: securityEvents.filter(e => e.type === 'account_locked').length,
        suspiciousActivity: securityEvents.filter(e => e.type === 'suspicious_activity').length
      },
      
      performanceSummary: {
        averageResponseTimes: analytics.averagePerformance,
        slowOperations: performanceMetrics.filter(m => m.duration > 5000).length,
        failedOperations: performanceMetrics.filter(m => !m.success).length,
        totalOperations: performanceMetrics.length
      },
      
      trends: calculateTrends(logs, securityEvents, performanceMetrics, since),
      
      topUsers: getTopUsers(securityEvents, logs),
      
      topIPs: getTopIPs(securityEvents),
      
      recentErrors: logs
        .filter(log => log.level === 'ERROR' || log.level === 'CRITICAL')
        .slice(0, 10)
        .map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          level: log.level,
          category: log.category,
          event: log.event,
          message: log.message,
          userId: log.userId
        })),
      
      systemHealth: {
        status: calculateSystemHealth(analytics),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Failed to get monitoring dashboard data:', error);
    
    return NextResponse.json(
      { error: 'Failed to get dashboard data' },
      { status: 500 }
    );
  }
}

function calculateTrends(
  logs: any[],
  securityEvents: any[],
  performanceMetrics: any[],
  since: number
) {
  const now = Date.now();
  const hourly = [];
  
  // Calculate hourly trends for the time range
  const hours = Math.min(24, Math.floor((now - since) / (60 * 60 * 1000)));
  
  for (let i = 0; i < hours; i++) {
    const hourStart = now - (i + 1) * 60 * 60 * 1000;
    const hourEnd = now - i * 60 * 60 * 1000;
    
    const hourLogs = logs.filter(log => 
      log.timestamp >= hourStart && log.timestamp < hourEnd
    );
    
    const hourSecurityEvents = securityEvents.filter(event =>
      event.timestamp >= hourStart && event.timestamp < hourEnd
    );
    
    const hourPerformanceMetrics = performanceMetrics.filter(metric =>
      metric.timestamp >= hourStart && metric.timestamp < hourEnd
    );
    
    hourly.unshift({
      hour: new Date(hourStart).toISOString(),
      logs: hourLogs.length,
      errors: hourLogs.filter(log => log.level === 'ERROR' || log.level === 'CRITICAL').length,
      logins: hourSecurityEvents.filter(e => e.type === 'login_success').length,
      failures: hourSecurityEvents.filter(e => e.type === 'login_failure').length,
      avgResponseTime: hourPerformanceMetrics.length > 0 
        ? hourPerformanceMetrics.reduce((sum, m) => sum + m.duration, 0) / hourPerformanceMetrics.length
        : 0
    });
  }
  
  return { hourly };
}

function getTopUsers(securityEvents: any[], logs: any[]) {
  const userActivity: Record<string, {
    userId: string;
    logins: number;
    failures: number;
    errors: number;
    lastActivity: number;
  }> = {};
  
  // Count security events by user
  securityEvents.forEach(event => {
    if (event.userId) {
      if (!userActivity[event.userId]) {
        userActivity[event.userId] = {
          userId: event.userId,
          logins: 0,
          failures: 0,
          errors: 0,
          lastActivity: 0
        };
      }
      
      const user = userActivity[event.userId];
      user.lastActivity = Math.max(user.lastActivity, event.timestamp);
      
      if (event.type === 'login_success') user.logins++;
      if (event.type === 'login_failure') user.failures++;
    }
  });
  
  // Count errors by user
  logs.forEach(log => {
    if (log.userId && (log.level === 'ERROR' || log.level === 'CRITICAL')) {
      if (userActivity[log.userId]) {
        userActivity[log.userId].errors++;
      }
    }
  });
  
  return Object.values(userActivity)
    .sort((a, b) => (b.logins + b.failures + b.errors) - (a.logins + a.failures + a.errors))
    .slice(0, 10);
}

function getTopIPs(securityEvents: any[]) {
  const ipActivity: Record<string, {
    ipAddress: string;
    events: number;
    logins: number;
    failures: number;
    lastActivity: number;
  }> = {};
  
  securityEvents.forEach(event => {
    if (!ipActivity[event.ipAddress]) {
      ipActivity[event.ipAddress] = {
        ipAddress: event.ipAddress,
        events: 0,
        logins: 0,
        failures: 0,
        lastActivity: 0
      };
    }
    
    const ip = ipActivity[event.ipAddress];
    ip.events++;
    ip.lastActivity = Math.max(ip.lastActivity, event.timestamp);
    
    if (event.type === 'login_success') ip.logins++;
    if (event.type === 'login_failure') ip.failures++;
  });
  
  return Object.values(ipActivity)
    .sort((a, b) => b.events - a.events)
    .slice(0, 10);
}

function calculateSystemHealth(analytics: any): 'healthy' | 'warning' | 'critical' {
  const { recentActivity } = analytics;
  
  // Calculate error rate
  const totalRecentActivity = recentActivity.logins + recentActivity.failures + recentActivity.errors;
  const errorRate = totalRecentActivity > 0 ? recentActivity.errors / totalRecentActivity : 0;
  
  // Calculate failure rate
  const authAttempts = recentActivity.logins + recentActivity.failures;
  const failureRate = authAttempts > 0 ? recentActivity.failures / authAttempts : 0;
  
  // Determine health status
  if (errorRate > 0.1 || failureRate > 0.5) {
    return 'critical';
  } else if (errorRate > 0.05 || failureRate > 0.2) {
    return 'warning';
  } else {
    return 'healthy';
  }
}

// POST endpoint for manual actions (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check admin access
    const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { action } = await request.json();
    const logger = getAuthLogger();

    switch (action) {
      case 'clear_logs':
        logger.clearLogs();
        return NextResponse.json({ success: true, message: 'Logs cleared' });
      
      case 'export_logs':
        const logs = logger.getLogs({ limit: 10000 });
        return NextResponse.json({ 
          success: true, 
          data: logs,
          count: logs.length 
        });
      
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Failed to execute monitoring action:', error);
    
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}