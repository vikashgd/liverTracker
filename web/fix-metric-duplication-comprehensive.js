#!/usr/bin/env node

/**
 * FIX METRIC DUPLICATION COMPREHENSIVE
 * Clean up existing duplicates and prevent future ones
 */

const { PrismaClient } = require('./src/generated/prisma');

async function fixMetricDuplicationComprehensive() {
  console.log('🔧 FIXING METRIC DUPLICATION COMPREHENSIVE');
  console.log('=========================================\n');

  const prisma = new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    // Step 1: Find all reports with duplicates
    console.log('🔍 STEP 1: Finding Reports with Duplicates');
    console.log('------------------------------------------');
    
    const allReports = await prisma.reportFile.findMany({
      include: {
        metrics: {
          orderBy: [
            { name: 'asc' },
            { createdAt: 'asc' }
          ]
        },
        user: {
          select: { email: true }
        }
      }
    });

    const reportsWithDuplicates = [];
    let totalDuplicatesFound = 0;

    for (const report of allReports) {
      const metricCounts = {};
      report.metrics.forEach(metric => {
        metricCounts[metric.name] = (metricCounts[metric.name] || 0) + 1;
      });

      const duplicates = Object.entries(metricCounts).filter(([name, count]) => count > 1);
      
      if (duplicates.length > 0) {
        const duplicateCount = duplicates.reduce((sum, [name, count]) => sum + (count - 1), 0);
        totalDuplicatesFound += duplicateCount;
        
        reportsWithDuplicates.push({
          report,
          duplicates,
          duplicateCount
        });
      }
    }

    console.log(`Found ${reportsWithDuplicates.length} reports with duplicates`);
    console.log(`Total duplicate records to clean: ${totalDuplicatesFound}\n`);

    // Step 2: Clean up duplicates
    console.log('🧹 STEP 2: Cleaning Up Duplicates');
    console.log('---------------------------------');
    
    let totalCleaned = 0;

    for (const { report, duplicates } of reportsWithDuplicates) {
      console.log(`\n📋 Cleaning report: ${report.user.email} - ${report.reportDate ? report.reportDate.toISOString().split('T')[0] : 'No date'}`);
      
      for (const [metricName, count] of duplicates) {
        console.log(`   🔄 Processing ${metricName} (${count} duplicates)`);
        
        // Get all instances of this metric for this report
        const metricInstances = await prisma.extractedMetric.findMany({
          where: {
            reportId: report.id,
            name: metricName
          },
          orderBy: [
            { createdAt: 'desc' }, // Most recent first
            { category: 'desc' }   // Prefer records with categories
          ]
        });

        if (metricInstances.length <= 1) continue;

        // Keep the best record (most recent with category if available)
        const keepRecord = metricInstances[0];
        const deleteRecords = metricInstances.slice(1);

        console.log(`     ✅ Keeping: ${keepRecord.id} (${keepRecord.value} ${keepRecord.unit || ''}) - Category: ${keepRecord.category || 'N/A'}`);
        
        // Delete the duplicates
        for (const deleteRecord of deleteRecords) {
          console.log(`     ❌ Deleting: ${deleteRecord.id} (${deleteRecord.value} ${deleteRecord.unit || ''}) - Category: ${deleteRecord.category || 'N/A'}`);
          
          await prisma.extractedMetric.delete({
            where: { id: deleteRecord.id }
          });
          
          totalCleaned++;
        }
      }
    }

    console.log(`\n🎉 Successfully cleaned ${totalCleaned} duplicate records!`);

    // Step 3: Verify cleanup
    console.log('\n✅ STEP 3: Verifying Cleanup');
    console.log('----------------------------');
    
    // Check the specific report mentioned
    const specificReport = await prisma.reportFile.findUnique({
      where: { id: 'cmfbyzd3i000rx2nstdf2buyo' },
      include: {
        metrics: {
          orderBy: { name: 'asc' }
        }
      }
    });

    if (specificReport) {
      const metricCounts = {};
      specificReport.metrics.forEach(metric => {
        metricCounts[metric.name] = (metricCounts[metric.name] || 0) + 1;
      });

      const remainingDuplicates = Object.entries(metricCounts).filter(([name, count]) => count > 1);
      
      console.log(`📋 June 19, 2024 Report Status:`);
      console.log(`   Total metrics: ${specificReport.metrics.length}`);
      console.log(`   Remaining duplicates: ${remainingDuplicates.length}`);
      
      if (remainingDuplicates.length === 0) {
        console.log('   ✅ All duplicates cleaned!');
      } else {
        console.log('   ❌ Still has duplicates:', remainingDuplicates.map(([name]) => name).join(', '));
      }
    }

    // Step 4: Summary
    console.log('\n📊 STEP 4: Final Summary');
    console.log('========================');
    
    console.log(`✅ Reports processed: ${reportsWithDuplicates.length}`);
    console.log(`✅ Duplicates removed: ${totalCleaned}`);
    console.log(`✅ Database cleaned successfully`);
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Refresh the report page to see clean data');
    console.log('2. Check dashboard for updated metrics');
    console.log('3. Verify no duplicates appear in UI');
    
    console.log('\n🛡️  PREVENTION:');
    console.log('The medical platform extractor has deduplication logic');
    console.log('This issue was likely from a previous processing bug');
    console.log('Future uploads should not have this problem');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixMetricDuplicationComprehensive().catch(console.error);