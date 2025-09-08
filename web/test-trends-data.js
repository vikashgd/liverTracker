/**
 * Test script to debug trends data fetching
 */

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function testTrendsData() {
  try {
    console.log('🔍 Testing trends data fetching...');
    
    // Get a user with data
    const users = await prisma.user.findMany({
      take: 1,
      include: {
        reportFiles: {
          include: {
            metrics: true
          },
          take: 5
        }
      }
    });
    
    if (users.length === 0) {
      console.log('❌ No users found');
      return;
    }
    
    const user = users[0];
    console.log(`👤 Testing with user: ${user.id} (${user.name})`);
    console.log(`📊 User has ${user.reportFiles.length} reports`);
    
    // Check what metrics are available
    const allMetrics = await prisma.extractedMetric.findMany({
      where: {
        report: { userId: user.id }
      },
      select: {
        name: true,
        value: true,
        unit: true,
        report: {
          select: {
            reportDate: true
          }
        }
      },
      orderBy: {
        report: { reportDate: 'desc' }
      },
      take: 20
    });
    
    console.log(`📈 Found ${allMetrics.length} metrics for user`);
    
    // Group by metric name
    const metricGroups = {};
    allMetrics.forEach(metric => {
      if (!metricGroups[metric.name]) {
        metricGroups[metric.name] = [];
      }
      metricGroups[metric.name].push({
        value: metric.value,
        unit: metric.unit,
        date: metric.report.reportDate
      });
    });
    
    console.log('\n📊 Available metrics:');
    Object.keys(metricGroups).forEach(metricName => {
      const count = metricGroups[metricName].length;
      const latest = metricGroups[metricName][0];
      console.log(`  ${metricName}: ${count} data points, latest: ${latest.value} ${latest.unit} (${latest.date.toLocaleDateString()})`);
    });
    
    // Test the medical data aggregator
    console.log('\n🔄 Testing MedicalDataAggregator...');
    
    // Import the aggregator (this might fail in Node.js context, but let's try)
    try {
      // We'll simulate what the aggregator does
      const commonMetrics = ['ALT', 'AST', 'Bilirubin', 'Platelets', 'Albumin', 'Creatinine', 'INR'];
      const foundTrends = [];
      
      for (const metric of commonMetrics) {
        // Check if we have data for this metric (case insensitive)
        const matchingMetrics = Object.keys(metricGroups).filter(name => 
          name.toLowerCase().includes(metric.toLowerCase()) ||
          metric.toLowerCase().includes(name.toLowerCase())
        );
        
        if (matchingMetrics.length > 0) {
          const metricName = matchingMetrics[0];
          const data = metricGroups[metricName];
          foundTrends.push({
            name: metric,
            actualName: metricName,
            dataPoints: data.length,
            latestValue: data[0].value,
            unit: data[0].unit
          });
        }
      }
      
      console.log('\n✅ Trends that would be found:');
      foundTrends.forEach(trend => {
        console.log(`  ${trend.name} (${trend.actualName}): ${trend.dataPoints} points, latest: ${trend.latestValue} ${trend.unit}`);
      });
      
      if (foundTrends.length === 0) {
        console.log('❌ No matching trends found');
        console.log('Available metric names:', Object.keys(metricGroups));
      }
      
    } catch (importError) {
      console.log('⚠️ Could not test aggregator directly:', importError.message);
    }
    
  } catch (error) {
    console.error('💥 Error testing trends data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTrendsData();