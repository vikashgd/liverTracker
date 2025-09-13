#!/usr/bin/env node

/**
 * Investigate Chart Data Mismatch
 * 
 * Check if data exists in ExtractedMetric table vs ReportFile.extractedJson
 */

const { PrismaClient } = require('./src/generated/prisma');

async function investigateDataMismatch() {
  console.log('🔍 INVESTIGATING CHART DATA MISMATCH');
  console.log('='.repeat(60));

  const prisma = new PrismaClient();

  try {
    // 1. Check ReportFile data (what shows on left side)
    console.log('\n1. 📄 CHECKING REPORTFILE DATA (Left side - Lab Results)');
    const reportFiles = await prisma.reportFile.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    console.log(`Found ${reportFiles.length} report files:`);
    reportFiles.forEach((report, index) => {
      console.log(`${index + 1}. Report ID: ${report.id}`);
      console.log(`   User: ${report.user.email}`);
      console.log(`   Created: ${report.createdAt}`);
      console.log(`   Report Date: ${report.reportDate}`);
      console.log(`   Has extractedJson: ${!!report.extractedJson}`);
      
      if (report.extractedJson) {
        const jsonData = typeof report.extractedJson === 'string' 
          ? JSON.parse(report.extractedJson) 
          : report.extractedJson;
        
        console.log(`   ExtractedJson keys: ${Object.keys(jsonData).join(', ')}`);
        
        // Look for common lab values
        const labValues = ['ALT', 'AST', 'Platelets', 'Bilirubin', 'Albumin'];
        labValues.forEach(lab => {
          if (jsonData[lab]) {
            console.log(`   ${lab}: ${jsonData[lab]}`);
          }
        });
      }
      console.log('');
    });

    // 2. Check ExtractedMetric data (what should show on right side)
    console.log('\n2. 📊 CHECKING EXTRACTEDMETRIC DATA (Right side - Charts)');
    const extractedMetrics = await prisma.extractedMetric.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        report: {
          include: {
            user: {
              select: { email: true }
            }
          }
        }
      }
    });

    console.log(`Found ${extractedMetrics.length} extracted metrics:`);
    
    if (extractedMetrics.length === 0) {
      console.log('❌ NO EXTRACTED METRICS FOUND!');
      console.log('   This explains why charts show "Data Loading Error"');
      console.log('   Lab results come from ReportFile.extractedJson');
      console.log('   Charts come from ExtractedMetric table');
    } else {
      extractedMetrics.forEach((metric, index) => {
        console.log(`${index + 1}. Metric: ${metric.name} = ${metric.value} ${metric.unit}`);
        console.log(`   Report: ${metric.report.id}`);
        console.log(`   User: ${metric.report.user.email}`);
        console.log(`   Created: ${metric.createdAt}`);
        console.log('');
      });
    }

    // 3. Check specific metrics that should appear in charts
    console.log('\n3. 🎯 CHECKING SPECIFIC METRICS FOR CHARTS');
    const chartMetrics = ['ALT', 'AST', 'Platelets', 'Bilirubin', 'Albumin'];
    
    for (const metricName of chartMetrics) {
      const count = await prisma.extractedMetric.count({
        where: { name: metricName }
      });
      console.log(`${metricName}: ${count} records in ExtractedMetric table`);
    }

    // 4. Data migration analysis
    console.log('\n4. 🔄 DATA MIGRATION ANALYSIS');
    console.log('ISSUE IDENTIFIED:');
    console.log('- Lab results (left side) come from ReportFile.extractedJson');
    console.log('- Charts (right side) come from ExtractedMetric table');
    console.log('- Data exists in extractedJson but not in ExtractedMetric');
    console.log('- Need to migrate/sync data between these sources');

  } catch (error) {
    console.error('❌ Investigation error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateDataMismatch().catch(console.error);