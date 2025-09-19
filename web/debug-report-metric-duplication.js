#!/usr/bin/env node

/**
 * DEBUG REPORT METRIC DUPLICATION
 * Investigate why metrics are repeating on specific report page
 */

const { PrismaClient } = require('./src/generated/prisma');

async function debugReportMetricDuplication() {
  console.log('🔍 DEBUGGING REPORT METRIC DUPLICATION');
  console.log('=====================================\n');

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
    const userEmail = 'vikashgd@gmail.com';
    
    console.log(`📋 Analyzing Report: ${reportId}`);
    console.log(`👤 User: ${userEmail}`);
    console.log(`📅 Expected Date: June 19, 2024\n`);

    // Step 1: Get the report details
    console.log('📄 STEP 1: Report Details');
    console.log('-------------------------');
    
    const report = await prisma.reportFile.findUnique({
      where: { id: reportId },
      include: {
        user: {
          select: { email: true, id: true }
        },
        metrics: {
          orderBy: [
            { name: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    if (!report) {
      console.log('❌ Report not found!');
      return;
    }

    console.log(`✅ Report found:`);
    console.log(`   User: ${report.user.email} (${report.user.id})`);
    console.log(`   Report Date: ${report.reportDate}`);
    console.log(`   Created: ${report.createdAt}`);
    console.log(`   Object Key: ${report.objectKey}`);
    console.log(`   Total Metrics: ${report.metrics.length}`);
    console.log(`   Has Extracted JSON: ${!!report.extractedJson}\n`);

    // Step 2: Analyze metric duplications
    console.log('🔍 STEP 2: Metric Duplication Analysis');
    console.log('-------------------------------------');
    
    const metricCounts = {};
    const metricDetails = {};
    
    report.metrics.forEach(metric => {
      if (!metricCounts[metric.name]) {
        metricCounts[metric.name] = 0;
        metricDetails[metric.name] = [];
      }
      metricCounts[metric.name]++;
      metricDetails[metric.name].push({
        id: metric.id,
        value: metric.value,
        unit: metric.unit,
        createdAt: metric.createdAt,
        category: metric.category,
        textValue: metric.textValue,
        originalValue: metric.originalValue,
        originalUnit: metric.originalUnit,
        wasConverted: metric.wasConverted
      });
    });

    // Find duplicates
    const duplicates = Object.entries(metricCounts).filter(([name, count]) => count > 1);
    const uniques = Object.entries(metricCounts).filter(([name, count]) => count === 1);

    console.log(`📊 Metric Summary:`);
    console.log(`   Unique metrics: ${uniques.length}`);
    console.log(`   Duplicated metrics: ${duplicates.length}`);
    console.log(`   Total metric records: ${report.metrics.length}\n`);

    if (duplicates.length > 0) {
      console.log('🚨 DUPLICATED METRICS:');
      console.log('=====================');
      
      duplicates.forEach(([metricName, count]) => {
        console.log(`\n📋 ${metricName} (${count} instances):`);
        
        metricDetails[metricName].forEach((detail, index) => {
          console.log(`   ${index + 1}. ID: ${detail.id}`);
          console.log(`      Value: ${detail.value} ${detail.unit || ''}`);
          console.log(`      Created: ${detail.createdAt.toISOString()}`);
          console.log(`      Category: ${detail.category || 'N/A'}`);
          console.log(`      Text Value: ${detail.textValue || 'N/A'}`);
          console.log(`      Original: ${detail.originalValue || 'N/A'} ${detail.originalUnit || ''}`);
          console.log(`      Was Converted: ${detail.wasConverted}`);
        });
      });
    }

    if (uniques.length > 0) {
      console.log('\n✅ UNIQUE METRICS:');
      console.log('==================');
      
      uniques.forEach(([metricName, count]) => {
        const detail = metricDetails[metricName][0];
        console.log(`📋 ${metricName}: ${detail.value} ${detail.unit || ''}`);
      });
    }

    // Step 3: Check for potential causes
    console.log('\n🔍 STEP 3: Root Cause Analysis');
    console.log('------------------------------');
    
    // Check creation timestamps
    const creationTimes = report.metrics.map(m => m.createdAt.getTime());
    const uniqueCreationTimes = [...new Set(creationTimes)];
    
    console.log(`Creation Time Analysis:`);
    console.log(`   Unique creation timestamps: ${uniqueCreationTimes.length}`);
    console.log(`   Total metrics: ${report.metrics.length}`);
    
    if (uniqueCreationTimes.length < report.metrics.length) {
      console.log(`   ⚠️  Multiple metrics created at same time - possible batch duplication`);
    }

    // Check for different values in duplicates
    if (duplicates.length > 0) {
      console.log(`\nDuplicate Value Analysis:`);
      
      duplicates.forEach(([metricName, count]) => {
        const values = metricDetails[metricName].map(d => d.value);
        const uniqueValues = [...new Set(values)];
        
        if (uniqueValues.length === 1) {
          console.log(`   ${metricName}: Same value (${uniqueValues[0]}) - exact duplicate`);
        } else {
          console.log(`   ${metricName}: Different values (${uniqueValues.join(', ')}) - multiple extractions`);
        }
      });
    }

    // Step 4: Check extraction source
    console.log('\n🤖 STEP 4: Extraction Source Analysis');
    console.log('------------------------------------');
    
    if (report.extractedJson) {
      console.log('✅ Has AI extraction data');
      
      // Parse extracted JSON to see if it contains duplicates
      try {
        const extracted = JSON.parse(report.extractedJson);
        console.log('AI Extraction Structure:');
        
        if (extracted.metrics) {
          const aiMetrics = Object.keys(extracted.metrics);
          console.log(`   Structured metrics: ${aiMetrics.length}`);
          console.log(`   Metrics: ${aiMetrics.join(', ')}`);
        }
        
        if (extracted.metricsAll && Array.isArray(extracted.metricsAll)) {
          console.log(`   MetricsAll array: ${extracted.metricsAll.length} items`);
          
          // Check for duplicates in metricsAll
          const allMetricNames = extracted.metricsAll.map(m => m.name);
          const allMetricCounts = {};
          allMetricNames.forEach(name => {
            allMetricCounts[name] = (allMetricCounts[name] || 0) + 1;
          });
          
          const aiDuplicates = Object.entries(allMetricCounts).filter(([name, count]) => count > 1);
          if (aiDuplicates.length > 0) {
            console.log(`   🚨 AI extraction contains duplicates:`);
            aiDuplicates.forEach(([name, count]) => {
              console.log(`      ${name}: ${count} times`);
            });
          }
        }
      } catch (error) {
        console.log('❌ Error parsing extracted JSON:', error.message);
      }
    } else {
      console.log('❌ No AI extraction data - manual processing only');
    }

    // Step 5: Recommendations
    console.log('\n💡 STEP 5: Recommendations');
    console.log('==========================');
    
    if (duplicates.length > 0) {
      console.log('🛠️  FIXES NEEDED:');
      console.log('1. Implement deduplication in medical platform extractor');
      console.log('2. Add unique constraints or checks before database insertion');
      console.log('3. Clean up existing duplicates in database');
      console.log('4. Update frontend to handle/filter duplicates');
      
      console.log('\n🔧 IMMEDIATE ACTIONS:');
      console.log('1. Remove duplicate metrics from this report');
      console.log('2. Keep the most recent or most complete metric record');
      console.log('3. Update extraction logic to prevent future duplicates');
    } else {
      console.log('✅ No duplicates found in this report');
    }

    // Step 6: Check if this is a widespread issue
    console.log('\n📊 STEP 6: Checking Other Reports');
    console.log('---------------------------------');
    
    const otherReports = await prisma.reportFile.findMany({
      where: {
        userId: report.user.id,
        id: { not: reportId }
      },
      include: {
        metrics: {
          select: { name: true }
        }
      },
      take: 5
    });

    console.log(`Checking ${otherReports.length} other reports for duplicates:`);
    
    for (const otherReport of otherReports) {
      const otherMetricCounts = {};
      otherReport.metrics.forEach(m => {
        otherMetricCounts[m.name] = (otherMetricCounts[m.name] || 0) + 1;
      });
      
      const otherDuplicates = Object.entries(otherMetricCounts).filter(([name, count]) => count > 1);
      const reportDate = otherReport.reportDate ? otherReport.reportDate.toISOString().split('T')[0] : 'No date';
      
      if (otherDuplicates.length > 0) {
        console.log(`   ❌ ${reportDate}: ${otherDuplicates.length} duplicate types`);
      } else {
        console.log(`   ✅ ${reportDate}: No duplicates`);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugReportMetricDuplication().catch(console.error);