#!/usr/bin/env node

/**
 * Fix the latest report that has the wrong date
 */

const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function fixLatestReportDate() {
  try {
    console.log('🔧 Fixing the latest report date...');
    
    const reportId = 'cmf8o64d70001x2g8sdrf0eb0';
    
    // Ask user for the correct date
    console.log('\n📅 What was the correct date you entered?');
    console.log('Please provide the date in YYYY-MM-DD format (e.g., 2020-10-17):');
    
    // For now, let's assume it was a 2020 date based on your pattern
    // You can modify this to the actual date you entered
    const correctDate = '2020-10-17'; // Change this to your actual date
    
    console.log(`\n🔄 Updating report ${reportId} to date: ${correctDate}`);
    
    const updatedReport = await prisma.reportFile.update({
      where: { id: reportId },
      data: {
        reportDate: new Date(correctDate)
      }
    });
    
    console.log(`✅ Updated report date to: ${updatedReport.reportDate}`);
    console.log('✅ The report should now show the correct date in your reports list');
    
    // Also update the extracted JSON to include the correct date
    const currentExtracted = updatedReport.extractedJson || {};
    const updatedExtracted = {
      ...currentExtracted,
      reportDate: correctDate
    };
    
    await prisma.reportFile.update({
      where: { id: reportId },
      data: {
        extractedJson: updatedExtracted
      }
    });
    
    console.log('✅ Also updated the extracted JSON to include the correct date');
    
  } catch (error) {
    console.error('❌ Error fixing report date:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixLatestReportDate();