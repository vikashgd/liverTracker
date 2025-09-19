#!/usr/bin/env node

/**
 * FIX SPECIFIC REPORT DUPLICATES
 * Clean up duplicates for the June 19, 2024 report
 */

const { PrismaClient } = require('./src/generated/prisma');

async function fixSpecificReportDuplicates() {
  console.log('🔧 FIXING SPECIFIC REPORT DUPLICATES');
  console.log('===================================\n');

  const prisma = new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    const reportId = 'cmfbyzd3i000rx2nstdf2buyo';
    
    console.log(`📋 Fixing Report: ${reportId}`);
    console.log(`📅 Date: June 19, 2024\n`);

    // Get all metrics for this report
    const metrics = await prisma.extractedMetric.findMany({
      where: { reportId },
      orderBy: [
        { name: 'asc' },
        { createdAt: 'desc' }, // Most recent first
        { category: 'desc' }   // Prefer records with categories
      ]
    });

    console.log(`Found ${metrics.length} total metrics\n`);

    // Group by metric name
    const metricGroups = {};
    metrics.forEach(metric => {
      if (!metricGroups[metric.name]) {
        metricGroups[metric.name] = [];
      }
      metricGroups[metric.name].push(metric);
    });

    // Find and fix duplicates
    let totalDeleted = 0;
    
    for (const [metricName, instances] of Object.entries(metricGroups)) {
      if (instances.length > 1) {
        console.log(`🔄 Processing ${metricName} (${instances.length} instances):`);
        
        // Keep the best record (most recent with category)
        const keepRecord = instances[0]; // Already sorted by our criteria
        const deleteRecords = instances.slice(1);
        
        console.log(`   ✅ Keeping: ${keepRecord.value} ${keepRecord.unit || ''} (Category: ${keepRecord.category || 'N/A'})`);
        
        // Delete duplicates
        for (const deleteRecord of deleteRecords) {
          console.log(`   ❌ Deleting: ${deleteRecord.value} ${deleteRecord.unit || ''} (Category: ${deleteRecord.category || 'N/A'})`);
          
          await prisma.extractedMetric.delete({
            where: { id: deleteRecord.id }
          });
          
          totalDeleted++;
        }
        console.log('');
      }
    }

    console.log(`🎉 Cleanup Complete!`);
    console.log(`   Duplicates removed: ${totalDeleted}`);
    
    // Verify the fix
    console.log('\n✅ Verification:');
    console.log('---------------');
    
    const cleanedMetrics = await prisma.extractedMetric.findMany({
      where: { reportId },
      orderBy: { name: 'asc' }
    });

    const cleanedCounts = {};
    cleanedMetrics.forEach(metric => {
      cleanedCounts[metric.name] = (cleanedCounts[metric.name] || 0) + 1;
    });

    const remainingDuplicates = Object.entries(cleanedCounts).filter(([name, count]) => count > 1);
    
    console.log(`📊 Final Status:`);
    console.log(`   Total metrics: ${cleanedMetrics.length}`);
    console.log(`   Unique metrics: ${Object.keys(cleanedCounts).length}`);
    console.log(`   Remaining duplicates: ${remainingDuplicates.length}`);
    
    if (remainingDuplicates.length === 0) {
      console.log('   ✅ All duplicates successfully removed!');
    } else {
      console.log('   ❌ Still has duplicates:', remainingDuplicates.map(([name]) => name).join(', '));
    }

    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Refresh the report page: http://localhost:8080/reports/cmfbyzd3i000rx2nstdf2buyo');
    console.log('2. Verify no duplicate metrics appear');
    console.log('3. Check dashboard for clean data');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixSpecificReportDuplicates().catch(console.error);