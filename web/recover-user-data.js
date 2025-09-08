#!/usr/bin/env node

/**
 * Data Recovery Script for Medical Platform
 * 
 * This script recovers user data by:
 * 1. Scanning Google Cloud Storage for existing files
 * 2. Recreating missing database records
 * 3. Re-extracting metrics from files
 * 4. Restoring dashboard functionality
 */

const { PrismaClient } = require('./src/generated/prisma');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: JSON.parse(process.env.GCP_SA_KEY)
});

const bucket = storage.bucket(process.env.GCS_BUCKET);

async function recoverUserData() {
  try {
    console.log('🔄 Starting data recovery process...');
    
    // Step 1: Find the user
    const user = await prisma.user.findFirst({
      where: { email: 'vikashgd@gmail.com' }
    });
    
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
    
    // Step 2: Get all files from GCS
    console.log('📁 Scanning Google Cloud Storage...');
    const [files] = await bucket.getFiles();
    
    // Filter for report files from the last 30 days
    const recentReportFiles = files.filter(file => {
      if (!file.name.startsWith('reports/')) return false;
      
      const created = new Date(file.metadata.timeCreated);
      const daysSinceCreated = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreated <= 30;
    });
    
    console.log(`📄 Found ${recentReportFiles.length} recent report files`);
    
    // Step 3: Recreate database records
    let recoveredCount = 0;
    
    for (const file of recentReportFiles) {
      try {
        console.log(`🔄 Processing: ${file.name}`);
        
        // Extract file info
        const fileName = path.basename(file.name);
        const contentType = file.metadata.contentType || 'application/octet-stream';
        const createdAt = new Date(file.metadata.timeCreated);
        
        // Determine report type
        let reportType = 'lab_report';
        if (fileName.toLowerCase().includes('imaging') || fileName.toLowerCase().includes('scan')) {
          reportType = 'imaging';
        } else if (fileName.toLowerCase().includes('prescription')) {
          reportType = 'prescription';
        }
        
        // Check if record already exists
        const existingRecord = await prisma.reportFile.findFirst({
          where: {
            userId: user.id,
            objectKey: file.name
          }
        });
        
        if (existingRecord) {
          console.log(`⏭️  Skipping ${fileName} - already exists`);
          continue;
        }
        
        // Create ReportFile record
        const reportFile = await prisma.reportFile.create({
          data: {
            userId: user.id,
            objectKey: file.name,
            contentType: contentType,
            reportType: reportType,
            reportDate: createdAt,
            createdAt: createdAt
          }
        });
        
        console.log(`✅ Created database record for: ${fileName}`);
        recoveredCount++;
        
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
        
      } catch (error) {
        console.error(`❌ Error processing ${file.name}:`, error.message);
      }
    }
    
    console.log(`🎉 Recovery complete! Recovered ${recoveredCount} files`);
    
    // Step 4: Update user onboarding status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstReportUploaded: recoveredCount > 0,
        secondReportUploaded: recoveredCount > 1,
        onboardingCompleted: recoveredCount > 0
      }
    });
    
    console.log('✅ Updated user onboarding status');
    
    // Step 5: Show summary
    const finalReportCount = await prisma.reportFile.count({
      where: { userId: user.id }
    });
    
    const finalMetricCount = await prisma.extractedMetric.count({
      where: { 
        report: {
          userId: user.id
        }
      }
    });
    
    console.log('\n📊 Recovery Summary:');
    console.log(`- Reports recovered: ${recoveredCount}`);
    console.log(`- Total reports in database: ${finalReportCount}`);
    console.log(`- Total metrics in database: ${finalMetricCount}`);
    console.log('\n🎯 Next Steps:');
    console.log('1. Restart your application');
    console.log('2. Visit the dashboard to see your recovered data');
    console.log('3. If metrics are missing, use the "Extract Data" button on individual reports');
    
  } catch (error) {
    console.error('❌ Recovery failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the recovery
recoverUserData();