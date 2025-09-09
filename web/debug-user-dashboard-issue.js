/**
 * Debug User Dashboard Issue - Simple version
 * Focus on the exact user ID and data loading issue
 */

const { PrismaClient } = require('./src/generated/prisma');

async function debugUserDashboardIssue() {
  console.log('🔍 DEBUGGING USER DASHBOARD ISSUE\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Step 1: Get the current user and their data
    console.log('👤 Step 1: Current user analysis...');
    
    const user = await prisma.user.findFirst({
      where: {
        email: 'vikashgd@gmail.com'
      },
      select: {
        id: true,
        email: true,
        reportFiles: {
          select: {
            id: true,
            createdAt: true,
            metrics: {
              select: {
                name: true,
                value: true,
                unit: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log(`✅ User found: ${user.email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Total reports: ${user.reportFiles.length}`);
    
    // Step 2: Analyze metrics in detail
    console.log('\n📊 Step 2: Detailed metrics analysis...');
    
    let allMetrics = [];
    user.reportFiles.forEach((report, idx) => {
      console.log(`\nReport ${idx + 1} (${report.createdAt.toDateString()}):`);
      console.log(`   Metrics count: ${report.metrics.length}`);
      
      report.metrics.forEach(metric => {
        allMetrics.push(metric);
      });
      
      // Show key metrics for this report
      const keyMetrics = ['ALT', 'AST', 'Bilirubin', 'Platelets', 'Creatinine', 'Albumin', 'INR', 'Sodium', 'Potassium'];
      keyMetrics.forEach(key => {
        const found = report.metrics.find(m => m.name === key);
        if (found) {
          console.log(`   ✅ ${key}: ${found.value} ${found.unit}`);
        } else {
          console.log(`   ❌ ${key}: Not found`);
        }
      });
    });
    
    // Step 3: Check what the dashboard should be loading
    console.log('\n🎯 Step 3: Dashboard loading analysis...');
    
    // Group all metrics by name
    const metricGroups = {};
    allMetrics.forEach(metric => {
      if (!metricGroups[metric.name]) {
        metricGroups[metric.name] = [];
      }
      metricGroups[metric.name].push(metric);
    });
    
    console.log(`Total unique metric types: ${Object.keys(metricGroups).length}`);
    console.log('\nMetric availability for dashboard:');
    
    const dashboardMetrics = ['ALT', 'AST', 'Bilirubin', 'Platelets', 'Creatinine', 'Albumin', 'INR', 'ALP', 'GGT', 'TotalProtein', 'Sodium', 'Potassium'];
    
    dashboardMetrics.forEach(metricName => {
      if (metricGroups[metricName]) {
        const count = metricGroups[metricName].length;
        const latest = metricGroups[metricName][metricGroups[metricName].length - 1];
        console.log(`   ✅ ${metricName}: ${count} data points, latest: ${latest.value} ${latest.unit}`);
      } else {
        console.log(`   ❌ ${metricName}: No data found`);
      }
    });
    
    // Step 4: Test direct database query that dashboard should use
    console.log('\n🔍 Step 4: Testing dashboard-style database query...');
    
    // This simulates what the medical platform should do
    const sodiumData = await prisma.extractedMetric.findMany({
      where: {
        report: {
          userId: user.id
        },
        name: 'Sodium'
      },
      select: {
        value: true,
        unit: true,
        createdAt: true,
        report: {
          select: {
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`Direct Sodium query result: ${sodiumData.length} data points`);
    if (sodiumData.length > 0) {
      sodiumData.forEach((point, idx) => {
        console.log(`   ${idx + 1}. ${point.value} ${point.unit} on ${point.report.createdAt.toDateString()}`);
      });
    }
    
    // Step 5: Identify the exact issue
    console.log('\n🎯 CONCLUSION:');
    console.log(`✅ User exists: ${user.email} (ID: ${user.id})`);
    console.log(`✅ User has ${user.reportFiles.length} reports with ${allMetrics.length} total metrics`);
    console.log(`✅ Sodium data exists: ${metricGroups['Sodium']?.length || 0} data points`);
    
    if (metricGroups['Sodium'] && metricGroups['Sodium'].length > 0) {
      console.log('\n🔧 THE ISSUE IS NOT DATA AVAILABILITY');
      console.log('The issue is likely in:');
      console.log('1. Dashboard authentication - wrong user ID being passed');
      console.log('2. Medical platform data loading logic');
      console.log('3. Chart data API not filtering correctly by user');
      console.log('4. Frontend not calling the API with correct parameters');
    } else {
      console.log('\n❌ THE ISSUE IS DATA AVAILABILITY');
      console.log('Sodium data is not being extracted or stored properly');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugUserDashboardIssue().catch(console.error);