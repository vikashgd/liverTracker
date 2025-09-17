#!/usr/bin/env node

/**
 * FIX METRIC NAME MAPPING
 * Update extracted metrics to use canonical names expected by dashboard
 */

const { PrismaClient } = require('./src/generated/prisma');

async function fixMetricNameMapping() {
  console.log('🔧 FIXING METRIC NAME MAPPING');
  console.log('=============================\n');

  const prisma = new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    // Define metric name mappings
    const nameMapping = {
      'Bilirubin Total': 'Bilirubin',
      'Bilirubin, Total': 'Bilirubin',
      'Total Bilirubin': 'Bilirubin',
      'Platelet Count': 'Platelets',
      'Platelet': 'Platelets',
      'Alkaline Phosphatase (ALP)': 'ALP',
      'Alkaline Phosphatase': 'ALP',
      'ALT (SGPT)': 'ALT',
      'AST (SGOT)': 'AST',
      'Gamma GT': 'GGT',
      'Gamma-GT': 'GGT',
      'γ-GT': 'GGT'
    };

    console.log('📋 Checking metrics that need name fixes...\n');

    // Find metrics with non-canonical names
    const metricsToFix = await prisma.extractedMetric.findMany({
      where: {
        name: {
          in: Object.keys(nameMapping)
        }
      },
      include: {
        report: {
          select: {
            userId: true,
            createdAt: true
          }
        }
      }
    });

    console.log(`Found ${metricsToFix.length} metrics to fix:`);

    if (metricsToFix.length === 0) {
      console.log('✅ No metric names need fixing!');
      return;
    }

    // Group by name for reporting
    const groupedMetrics = {};
    metricsToFix.forEach(metric => {
      if (!groupedMetrics[metric.name]) {
        groupedMetrics[metric.name] = [];
      }
      groupedMetrics[metric.name].push(metric);
    });

    Object.entries(groupedMetrics).forEach(([oldName, metrics]) => {
      const newName = nameMapping[oldName];
      console.log(`📝 "${oldName}" → "${newName}" (${metrics.length} records)`);
    });

    console.log('\n🔄 Applying fixes...\n');

    // Apply fixes
    let totalFixed = 0;
    for (const [oldName, newName] of Object.entries(nameMapping)) {
      const result = await prisma.extractedMetric.updateMany({
        where: {
          name: oldName
        },
        data: {
          name: newName
        }
      });

      if (result.count > 0) {
        console.log(`✅ Fixed ${result.count} "${oldName}" → "${newName}"`);
        totalFixed += result.count;
      }
    }

    console.log(`\n🎉 Successfully fixed ${totalFixed} metric names!`);

    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    const dashboardMetrics = ['ALT', 'AST', 'Platelets', 'Bilirubin', 'Albumin', 'ALP', 'GGT'];
    
    for (const metricName of dashboardMetrics) {
      const count = await prisma.extractedMetric.count({
        where: { name: metricName }
      });
      console.log(`   ${metricName}: ${count} records`);
    }

    console.log('\n✅ Metric name mapping complete!');
    console.log('🔄 Now refresh your dashboard to see the data.');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixMetricNameMapping().catch(console.error);