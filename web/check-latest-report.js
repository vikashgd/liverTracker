#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('./src/generated/prisma');

async function checkLatestReport() {
  const prisma = new PrismaClient();
  try {
    console.log('🔍 Checking the latest uploaded report...\n');
    
    const report = await prisma.reportFile.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        objectKey: true,
        contentType: true,
        createdAt: true,
        userId: true,
        reportType: true
      }
    });
    
    if (report) {
      console.log('📊 Latest report details:');
      console.log(`   ID: ${report.id}`);
      console.log(`   ObjectKey: '${report.objectKey || 'EMPTY'}'`);
      console.log(`   ReportType: ${report.reportType || 'null'}`);
      console.log(`   ContentType: ${report.contentType || 'null'}`);
      console.log(`   Created: ${report.createdAt}`);
      
      if (!report.objectKey || report.objectKey === '') {
        console.log('\n❌ ISSUE FOUND: objectKey is empty!');
        console.log('   This explains why file preview is not working.');
        console.log('   The database record exists but points to no file.');
      } else {
        console.log(`\n✅ ObjectKey exists: ${report.objectKey}`);
        console.log('   Now checking if this file exists in GCS...');
      }
    } else {
      console.log('❌ No reports found in database');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestReport();