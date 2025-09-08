#!/usr/bin/env node

/**
 * Debug script to understand the manual date issue
 */

const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function debugManualDateIssue() {
  try {
    console.log('🔍 Debugging manual date issue...');
    
    // Get the problematic report
    const report = await prisma.reportFile.findFirst({
      where: { id: 'cmf8o64d70001x2g8sdrf0eb0' },
      select: {
        id: true,
        reportDate: true,
        createdAt: true,
        objectKey: true,
        extractedJson: true
      }
    });
    
    if (!report) {
      console.log('❌ Report not found');
      return;
    }
    
    console.log('\n📄 Problematic Report:');
    console.log('ID:', report.id);
    console.log('Object Key:', report.objectKey);
    console.log('Report Date (DB):', report.reportDate);
    console.log('Created At:', report.createdAt);
    console.log('Extracted JSON:', JSON.stringify(report.extractedJson, null, 2));
    
    console.log('\n🤔 Analysis:');
    console.log('1. Report Date in DB:', report.reportDate?.toISOString());
    console.log('2. Created At:', report.createdAt?.toISOString());
    console.log('3. Extracted reportDate:', report.extractedJson?.reportDate);
    
    // Check if they're the same (indicating fallback was used)
    const reportTime = new Date(report.reportDate).getTime();
    const createdTime = new Date(report.createdAt).getTime();
    const timeDiff = Math.abs(reportTime - createdTime);
    
    console.log('4. Time difference between reportDate and createdAt:', timeDiff, 'ms');
    
    if (timeDiff < 5000) { // Less than 5 seconds difference
      console.log('🚨 ISSUE CONFIRMED: reportDate and createdAt are nearly identical!');
      console.log('   This means the API used new Date() fallback instead of manual date');
      console.log('   The manual date was not properly received by the API');
    } else {
      console.log('✅ Dates are different, manual date was likely used');
    }
    
    console.log('\n💡 Next Steps:');
    console.log('1. Check what data is being sent to /api/reports');
    console.log('2. Add logging to the API to see received data');
    console.log('3. Verify the uploader is sending the correct format');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugManualDateIssue();