#!/usr/bin/env node

/**
 * CHECK CURRENT DUPLICATES
 * Quick check for duplicates in the specific report
 */

const { PrismaClient } = require('./src/generated/prisma');

async function checkCurrentDuplicates() {
  console.log('🔍 CHECKING CURRENT DUPLICATES');
  console.log('==============================\n');

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
    
    console.log(`📋 Checking Report: ${reportId}`);
    console.log(`📅 Expected: June 19, 2024\n`);

    // Get all metrics for this report
    const metrics = await prisma.extractedMetric.findMany({
      where: { reportId },
      orderBy: [
        { name: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    console.log(`Found ${metrics.length} total metrics\n`);

    // Group by metric name to find duplicates
    const metricGroups = {};
    metrics.forEach(metric => {
      if (!metricGroups[metric.name]) {
        metricGroups[metric.name] = [];
      }
      metricGroups[metric.name].push(metric);
    });

    // Check for duplicates
    const duplicates = [];
    const uniques = [];

    for (const [metricName, instances] of Object.entries(metricGroups)) {
      if (instances.length > 1) {
        duplicates.push({ name: metricName, count: instances.length, instances });
      } else {
        uniques.push({ name: metricName, instance: instances[0] });
      }
    }

    console.log('📊 CURRENT STATUS:');
    console.log('==================');
    console.log(`✅ Unique metrics: ${uniques.length}`);
    console.log(`❌ Duplicated metrics: ${duplicates.length}`);
    console.log(`📈 Total records: ${metrics.length}\n`);

    if (duplicates.length > 0) {
      console.log('🚨 DUPLICATES FOUND:');
      console.log('====================');
      
      duplicates.forEach(({ name, count, instances }) => {
        console.log(`\n📋 ${name} (${count} instances):`);
        instances.forEach((instance, index) => {
          console.log(`   ${index + 1}. ID: ${instance.id}`);
          console.log(`      Value: ${instance.value} ${instance.unit || ''}`);
          console.log(`      Created: ${instance.createdAt.toISOString()}`);
          console.log(`      Category: ${instance.category || 'N/A'}`);
        });
      });

      console.log('\n💡 ISSUE CONFIRMED:');
      console.log('===================');
      console.log('The duplicates are still in the database.');
      console.log('Either the cleanup script failed or new duplicates were created.');
      
    } else {
      console.log('✅ NO DUPLICATES IN DATABASE');
      console.log('============================');
      console.log('The issue might be in the frontend display logic.');
    }

    // Check specific metrics mentioned
    const platelets = metricGroups['Platelets'] || [];
    const inr = metricGroups['INR'] || [];

    console.log('\n🎯 SPECIFIC METRICS CHECK:');
    console.log('==========================');
    console.log(`Platelets instances: ${platelets.length}`);
    console.log(`INR instances: ${inr.length}`);

    if (platelets.length > 1) {
      console.log('\n❌ Platelets duplicated:');
      platelets.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.value} ${p.unit} (ID: ${p.id})`);
      });
    }

    if (inr.length > 1) {
      console.log('\n❌ INR duplicated:');
      inr.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.value} ${p.unit || 'ratio'} (ID: ${p.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkCurrentDuplicates().catch(console.error);