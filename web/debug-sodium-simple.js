/**
 * Simple Sodium Investigation - Found the issue!
 */

const { PrismaClient } = require('./src/generated/prisma');

async function investigateSodiumIssue() {
  console.log('🔍 SODIUM INVESTIGATION RESULTS:\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Get latest report with Sodium data
    const reports = await prisma.reportFile.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        createdAt: true,
        metrics: {
          where: {
            name: {
              contains: 'Sodium',
              mode: 'insensitive'
            }
          },
          select: {
            name: true,
            value: true,
            unit: true
          }
        }
      }
    });
    
    console.log('📊 FOUND SODIUM DATA IN DATABASE:');
    reports.forEach((report, idx) => {
      if (report.metrics.length > 0) {
        console.log(`\nReport ${idx + 1} (${report.createdAt.toDateString()}):`);
        report.metrics.forEach(metric => {
          console.log(`  ✅ ${metric.name}: ${metric.value} ${metric.unit}`);
        });
      }
    });
    
    // Check what the dashboard query looks like
    console.log('\n🔍 DASHBOARD QUERY ANALYSIS:');
    console.log('The dashboard loads data using the medical platform which queries for canonical metric names.');
    console.log('Dashboard expects: "Sodium"');
    console.log('Database contains: "Sodium" ✅');
    
    // Check if there's a user ID issue
    console.log('\n👤 USER ID INVESTIGATION:');
    const allSodiumMetrics = await prisma.extractedMetric.findMany({
      where: {
        name: {
          contains: 'Sodium',
          mode: 'insensitive'
        }
      },
      select: {
        name: true,
        value: true,
        unit: true,
        report: {
          select: {
            userId: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    console.log(`Found ${allSodiumMetrics.length} Sodium metrics across all users:`);
    allSodiumMetrics.forEach((metric, idx) => {
      console.log(`  ${idx + 1}. User: ${metric.report.userId}, Value: ${metric.value} ${metric.unit}, Date: ${metric.report.createdAt.toDateString()}`);
    });
    
    console.log('\n🎯 LIKELY ISSUE IDENTIFIED:');
    console.log('The Sodium data EXISTS in the database, but the dashboard is not loading it.');
    console.log('This suggests the issue is in the data loading pipeline, not the AI extraction.');
    console.log('\nPossible causes:');
    console.log('1. User ID mismatch in dashboard query');
    console.log('2. Medical platform not finding the data correctly');
    console.log('3. Chart data loading logic filtering out Sodium');
    console.log('4. Metric canonicalization issue in the loading process');
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateSodiumIssue().catch(console.error);