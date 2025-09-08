#!/usr/bin/env node

/**
 * Test the date fix to ensure it works correctly
 */

const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function testDateFix() {
  try {
    console.log('🧪 Testing date fix...');
    
    // Get the specific report
    const report = await prisma.reportFile.findFirst({
      where: { id: 'cmf894xyl0001x2r94d7mq928' },
      select: {
        id: true,
        reportDate: true,
        createdAt: true,
        objectKey: true
      }
    });
    
    if (!report) {
      console.log('❌ Report not found');
      return;
    }
    
    console.log('\n📄 Report Data:');
    console.log('ID:', report.id);
    console.log('Object Key:', report.objectKey);
    console.log('Report Date (raw):', report.reportDate);
    console.log('Created At (raw):', report.createdAt);
    
    // Test the transformation logic (same as in the server component)
    const transformedReport = {
      ...report,
      reportDate: report.reportDate ? new Date(report.reportDate) : null,
      createdAt: new Date(report.createdAt)
    };
    
    console.log('\n🔄 After Transformation:');
    console.log('Report Date (transformed):', transformedReport.reportDate);
    console.log('Created At (transformed):', transformedReport.createdAt);
    
    // Test the date selection logic (same as in the client component)
    const reportDate = transformedReport.reportDate || transformedReport.createdAt;
    console.log('Date used for display:', reportDate);
    
    // Test the formatting function (updated version)
    const formatReportDate = (date) => {
      const d = new Date(date);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    };
    
    const formattedDate = formatReportDate(reportDate);
    console.log('\n✅ Final Formatted Date:', formattedDate);
    
    // Verify it's correct
    if (formattedDate === 'Oct 17, 2020') {
      console.log('🎉 SUCCESS: Date formatting is now correct!');
    } else {
      console.log('❌ ISSUE: Expected "Oct 17, 2020" but got:', formattedDate);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDateFix();