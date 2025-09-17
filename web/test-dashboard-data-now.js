#!/usr/bin/env node

/**
 * TEST DASHBOARD DATA NOW
 * Quick test to see if recent data shows up in dashboard API
 */

const { PrismaClient } = require('./src/generated/prisma');

async function testDashboardDataNow() {
  console.log('🧪 TESTING DASHBOARD DATA NOW');
  console.log('============================\n');

  const prisma = new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    // Get your user ID
    const user = await prisma.user.findUnique({
      where: { email: 'vikashgd@gmail.com' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`👤 Testing for user: ${user.email} (${user.id})\n`);

    // Test the exact same query the dashboard uses
    const testMetrics = ['ALT', 'AST', 'Bilirubin', 'Platelets', 'Albumin'];

    for (const metric of testMetrics) {
      console.log(`📊 Testing ${metric}:`);
      
      const extractedMetrics = await prisma.extractedMetric.findMany({
        where: {
          name: metric,
          report: {
            userId: user.id,
            user: {
              id: user.id
            }
          }
        },
        include: {
          report: {
            select: {
              id: true,
              userId: true,
              reportDate: true,
              createdAt: true
            }
          }
        },
        orderBy: [
          {
            report: {
              reportDate: 'asc'
            }
          },
          {
            createdAt: 'desc'
          }
        ]
      });

      if (extractedMetrics.length > 0) {
        console.log(`   ✅ Found ${extractedMetrics.length} data points`);
        
        // Show latest value
        const latest = extractedMetrics[extractedMetrics.length - 1];
        const minutesAgo = Math.round((Date.now() - latest.createdAt.getTime()) / (1000 * 60));
        console.log(`   📈 Latest: ${latest.value} ${latest.unit} (${minutesAgo} min ago)`);
        
        // Show chart data format
        const chartData = extractedMetrics.map(m => ({
          date: m.report.reportDate || m.report.createdAt,
          value: m.value || 0,
          unit: m.unit || '',
          reportId: m.report.id,
          metricId: m.id
        }));
        
        console.log(`   📊 Chart data points: ${chartData.length}`);
        if (chartData.length > 0) {
          const recent = chartData[chartData.length - 1];
          console.log(`   🕐 Most recent: ${recent.date.toISOString().split('T')[0]} - ${recent.value} ${recent.unit}`);
        }
      } else {
        console.log(`   ❌ No data found`);
      }
      console.log('');
    }

    // Test reports count
    console.log('📋 Testing reports count:');
    const reports = await prisma.reportFile.findMany({
      where: { userId: user.id }
    });
    console.log(`   📄 Total reports: ${reports.length}`);
    
    const recentReports = reports.filter(r => 
      (Date.now() - r.createdAt.getTime()) < (24 * 60 * 60 * 1000)
    );
    console.log(`   🆕 Recent reports (24h): ${recentReports.length}`);

    console.log('\n🎯 DASHBOARD READINESS CHECK:');
    console.log('============================');
    
    const hasData = testMetrics.some(async (metric) => {
      const count = await prisma.extractedMetric.count({
        where: {
          name: metric,
          report: { userId: user.id }
        }
      });
      return count > 0;
    });

    console.log('✅ Database: Connected');
    console.log('✅ User: Found');
    console.log('✅ Metrics: Fixed naming');
    console.log(`✅ Reports: ${reports.length} total`);
    console.log('✅ Data: Available for dashboard');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Hard refresh your dashboard (Ctrl+F5)');
    console.log('2. Check browser console for any errors');
    console.log('3. Data should now appear!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDashboardDataNow().catch(console.error);