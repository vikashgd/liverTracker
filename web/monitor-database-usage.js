/**
 * DATABASE USAGE MONITOR
 * Monitor database query patterns and connection usage
 * Run this before and after optimization changes
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

class DatabaseUsageMonitor {
  constructor() {
    this.startTime = Date.now();
    this.queryCount = 0;
    this.connectionCount = 0;
    this.errors = [];
    this.queryTypes = {};
    this.responseTimes = [];
  }

  async startMonitoring(durationMinutes = 10) {
    console.log('📊 DATABASE USAGE MONITORING STARTED');
    console.log('====================================');
    console.log(`⏰ Duration: ${durationMinutes} minutes`);
    console.log(`🕐 Start time: ${new Date().toISOString()}`);
    
    const endTime = Date.now() + (durationMinutes * 60 * 1000);
    
    // Monitor database queries
    const monitorInterval = setInterval(async () => {
      await this.checkDatabaseActivity();
    }, 5000); // Check every 5 seconds
    
    // Wait for monitoring period
    await new Promise(resolve => {
      setTimeout(() => {
        clearInterval(monitorInterval);
        resolve();
      }, durationMinutes * 60 * 1000);
    });
    
    return this.generateReport();
  }

  async checkDatabaseActivity() {
    try {
      const startTime = Date.now();
      const prisma = new PrismaClient();
      
      // Test query to measure response time
      await prisma.$queryRaw\`SELECT 1 as test\`;
      
      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);
      this.queryCount++;
      
      await prisma.$disconnect();
      
      // Log activity
      if (this.queryCount % 10 === 0) {
        console.log(`📈 Queries monitored: ${this.queryCount}, Avg response: ${this.getAverageResponseTime()}ms`);
      }
      
    } catch (error) {
      this.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message
      });
      console.log(`❌ Database error: ${error.message}`);
    }
  }

  getAverageResponseTime() {
    if (this.responseTimes.length === 0) return 0;
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.responseTimes.length);
  }

  generateReport() {
    const duration = (Date.now() - this.startTime) / 1000 / 60; // minutes
    const queriesPerMinute = this.queryCount / duration;
    const estimatedDailyQueries = queriesPerMinute * 60 * 24;
    const estimatedMonthlyQueries = estimatedDailyQueries * 30;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration_minutes: Math.round(duration * 100) / 100,
      total_queries: this.queryCount,
      queries_per_minute: Math.round(queriesPerMinute * 100) / 100,
      estimated_daily_queries: Math.round(estimatedDailyQueries),
      estimated_monthly_queries: Math.round(estimatedMonthlyQueries),
      average_response_time_ms: this.getAverageResponseTime(),
      min_response_time_ms: Math.min(...this.responseTimes),
      max_response_time_ms: Math.max(...this.responseTimes),
      error_count: this.errors.length,
      errors: this.errors
    };
    
    // Save report
    const filename = \`database-usage-\${Date.now()}.json\`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    
    // Display report
    console.log('\n📊 DATABASE USAGE REPORT');
    console.log('========================');
    console.log(\`⏰ Monitoring Duration: \${report.duration_minutes} minutes\`);
    console.log(\`📈 Total Queries: \${report.total_queries}\`);
    console.log(\`🔄 Queries/Minute: \${report.queries_per_minute}\`);
    console.log(\`📅 Estimated Daily Queries: \${report.estimated_daily_queries}\`);
    console.log(\`📆 Estimated Monthly Queries: \${report.estimated_monthly_queries}\`);
    console.log(\`⚡ Average Response Time: \${report.average_response_time_ms}ms\`);
    console.log(\`❌ Errors: \${report.error_count}\`);
    
    // Cost estimation
    const estimatedComputeUnits = report.estimated_monthly_queries * 0.01; // Rough estimate
    const estimatedCost = estimatedComputeUnits * 0.14;
    
    console.log(\`\n💰 COST ESTIMATION:\`);
    console.log(\`📊 Estimated Compute Units/Month: \${Math.round(estimatedComputeUnits)}\`);
    console.log(\`💵 Estimated Cost/Month: $\${estimatedCost.toFixed(2)}\`);
    
    console.log(\`\n💾 Report saved: \${filename}\`);
    
    return report;
  }
}

// Test specific API endpoints
async function testAPIEndpoints() {
  console.log('\n🔍 TESTING API ENDPOINTS');
  console.log('========================');
  
  const endpoints = [
    '/api/health',
    '/api/onboarding',
    '/api/warmup-db'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(\`Testing \${endpoint}...\`);
      const startTime = Date.now();
      
      const response = await fetch(\`http://localhost:3000\${endpoint}\`);
      const responseTime = Date.now() - startTime;
      
      console.log(\`   ✅ \${endpoint}: \${response.status} (\${responseTime}ms)\`);
    } catch (error) {
      console.log(\`   ❌ \${endpoint}: \${error.message}\`);
    }
  }
}

// Compare two monitoring reports
function compareReports(beforeFile, afterFile) {
  console.log('\n📊 COMPARING DATABASE USAGE REPORTS');
  console.log('===================================');
  
  try {
    const before = JSON.parse(fs.readFileSync(beforeFile, 'utf8'));
    const after = JSON.parse(fs.readFileSync(afterFile, 'utf8'));
    
    const queryReduction = ((before.estimated_monthly_queries - after.estimated_monthly_queries) / before.estimated_monthly_queries * 100);
    const responseTimeChange = ((after.average_response_time_ms - before.average_response_time_ms) / before.average_response_time_ms * 100);
    
    console.log(\`📈 Monthly Queries: \${before.estimated_monthly_queries} → \${after.estimated_monthly_queries}\`);
    console.log(\`📉 Query Reduction: \${queryReduction.toFixed(1)}%\`);
    console.log(\`⚡ Response Time: \${before.average_response_time_ms}ms → \${after.average_response_time_ms}ms\`);
    console.log(\`📊 Response Time Change: \${responseTimeChange.toFixed(1)}%\`);
    
    // Cost comparison
    const beforeCost = before.estimated_monthly_queries * 0.01 * 0.14;
    const afterCost = after.estimated_monthly_queries * 0.01 * 0.14;
    const costSavings = beforeCost - afterCost;
    
    console.log(\`\n💰 COST COMPARISON:\`);
    console.log(\`💵 Before: $\${beforeCost.toFixed(2)}/month\`);
    console.log(\`💵 After: $\${afterCost.toFixed(2)}/month\`);
    console.log(\`💰 Savings: $\${costSavings.toFixed(2)}/month (\${(costSavings/beforeCost*100).toFixed(1)}%)\`);
    
  } catch (error) {
    console.error('❌ Error comparing reports:', error.message);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'monitor') {
    const duration = parseInt(args[1]) || 10;
    const monitor = new DatabaseUsageMonitor();
    monitor.startMonitoring(duration);
  } else if (command === 'test-apis') {
    testAPIEndpoints();
  } else if (command === 'compare') {
    const beforeFile = args[1];
    const afterFile = args[2];
    if (beforeFile && afterFile) {
      compareReports(beforeFile, afterFile);
    } else {
      console.log('Usage: node monitor-database-usage.js compare <before-file> <after-file>');
    }
  } else {
    console.log('Usage:');
    console.log('  node monitor-database-usage.js monitor [duration-minutes]');
    console.log('  node monitor-database-usage.js test-apis');
    console.log('  node monitor-database-usage.js compare <before-file> <after-file>');
  }
}

module.exports = { DatabaseUsageMonitor, testAPIEndpoints, compareReports };