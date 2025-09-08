#!/usr/bin/env node

/**
 * Quick fix to update the report date for a specific report
 */

const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function fixReportDate() {
  try {
    const reportId = 'cmf894xyl0001x2r94d7mq928'; // Your report ID
    const correctDate = '2020-10-17'; // October 17, 2020
    
    console.log(`🔧 Fixing report date for ${reportId}...`);
    
    const updatedReport = await prisma.reportFile.update({
      where: { id: reportId },
      data: {
        reportDate: new Date(correctDate)
      }
    });
    
    console.log(`✅ Updated report date to: ${updatedReport.reportDate}`);
    console.log('✅ The report should now show the correct date in your reports list');
    
  } catch (error) {
    console.error('❌ Error fixing report date:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixReportDate();