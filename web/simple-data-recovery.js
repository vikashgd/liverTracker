#!/usr/bin/env node

/**
 * Simple Data Recovery Script
 * 
 * Creates database records for known files without accessing GCS directly
 */

const { PrismaClient } = require('./src/generated/prisma');

require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

// Known files from our GCS scan
const knownFiles = [
  'reports/1757055708231-589-dr lal july report.pdf',
  'reports/1757055470863-506-488770641_SL_2025-08-07T13:51:00_report.pdf',
  'reports/1757043647025-batch-2-345-IMG_3960.jpg',
  'reports/1757043647025-batch-1-345-IMG_3961.jpg',
  'reports/1757043647025-batch-0-345-IMG_3962.jpg',
  'reports/1757015162607-121-YASODA 29-10-2020.pdf',
  'reports/1757014902545-batch-1-243-IMG_3957-vijaya-09-2020-2.jpg',
  'reports/1757014902545-batch-0-243-IMG_3957-vijaya-09-2020-1.jpg',
  'reports/1757014176417-batch-1-762-IMG_3957-vijaya-09-2020-1.jpg',
  'reports/1757012974651-batch-1-27-IMG_3957-vijaya-09-2020-2.jpg',
  'reports/1757006326271-batch-1-802-IMG_3957-vijaya-09-2020-2.jpg',
  'reports/1757006318924-batch-0-555-IMG_3957-vijaya-09-2020-1.jpg',
  'reports/1757005663093-batch-1-440-IMG_3957-vijaya-09-2020-2.jpg',
  'reports/1757005654401-batch-0-165-IMG_3957-vijaya-09-2020-1.jpg',
  'reports/1756979961863-batch-1-191-IMG_3957-vijaya-09-2020-1.jpg',
  'reports/1756979955078-batch-0-678-IMG_3957-vijaya-09-2020-2.jpg',
  'reports/1756967303662-320-YASODA 29-10-2020.pdf'
];

async function simpleRecovery() {
  try {
    console.log('🔄 Starting simple data recovery...');
    
    // Find the user
    const user = await prisma.user.findFirst({
      where: { email: 'vikashgd@gmail.com' }
    });
    
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    
    console.log(`✅ Found user: ${user.email}`);
    
    let recoveredCount = 0;
    
    for (const filePath of knownFiles) {
      try {
        // Extract timestamp from filename
        const timestamp = filePath.match(/(\d{13})/)?.[1];
        const createdAt = timestamp ? new Date(parseInt(timestamp)) : new Date();
        
        // Determine content type and report type
        const fileName = filePath.split('/').pop();
        const isImage = fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/);
        const isPdf = fileName.toLowerCase().endsWith('.pdf');
        
        const contentType = isImage ? 'image/jpeg' : isPdf ? 'application/pdf' : 'application/octet-stream';
        const reportType = 'lab_report';
        
        // Check if already exists
        const existing = await prisma.reportFile.findFirst({
          where: {
            userId: user.id,
            objectKey: filePath
          }
        });
        
        if (existing) {
          console.log(`⏭️  Skipping ${fileName} - already exists`);
          continue;
        }
        
        // Create the record
        const reportFile = await prisma.reportFile.create({
          data: {
            userId: user.id,
            objectKey: filePath,
            contentType: contentType,
            reportType: reportType,
            reportDate: createdAt,
            createdAt: createdAt
          }
        });
        
        // Create timeline event
        await prisma.timelineEvent.create({
          data: {
            userId: user.id,
            type: 'report_uploaded',
            reportId: reportFile.id,
            details: {
              fileName: fileName,
              reportType: reportType,
              recovered: true
            },
            occurredAt: createdAt
          }
        });
        
        console.log(`✅ Recovered: ${fileName}`);
        recoveredCount++;
        
      } catch (error) {
        console.error(`❌ Error with ${filePath}:`, error.message);
      }
    }
    
    // Update user status
    if (recoveredCount > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstReportUploaded: true,
          secondReportUploaded: recoveredCount > 1,
          onboardingCompleted: true,
          onboardingCompletedAt: new Date()
        }
      });
      
      console.log('✅ Updated user onboarding status');
    }
    
    // Show final counts
    const totalReports = await prisma.reportFile.count({
      where: { userId: user.id }
    });
    
    console.log(`\n🎉 Recovery Complete!`);
    console.log(`📄 Recovered ${recoveredCount} files`);
    console.log(`📊 Total reports in database: ${totalReports}`);
    console.log(`\n🎯 Next Steps:`);
    console.log(`1. Restart your application`);
    console.log(`2. Visit /reports to see your recovered files`);
    console.log(`3. Use "Extract Data" buttons to re-extract metrics`);
    console.log(`4. Visit /dashboard to see your data`);
    
  } catch (error) {
    console.error('❌ Recovery failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleRecovery();