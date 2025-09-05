#!/usr/bin/env node

/**
 * Test File Preview Functionality
 * 
 * This script tests if file preview is working correctly by:
 * 1. Finding a report with an objectKey
 * 2. Testing the file API endpoint
 * 3. Checking if the file exists in GCS
 */

const { PrismaClient } = require('./src/generated/prisma');

async function testFilePreview() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing file preview functionality...\n');
    
    // Find a report with an objectKey
    const report = await prisma.reportFile.findFirst({
      select: {
        id: true,
        objectKey: true,
        contentType: true,
        reportType: true,
        createdAt: true
      }
    });
    
    if (!report) {
      console.log('❌ No reports found with objectKey');
      return;
    }
    
    console.log('📋 Found report:');
    console.log(`   ID: ${report.id}`);
    console.log(`   Object Key: ${report.objectKey}`);
    console.log(`   Content Type: ${report.contentType || 'Unknown'}`);
    console.log(`   Report Type: ${report.reportType || 'Unknown'}`);
    console.log(`   Created: ${report.createdAt.toISOString()}\n`);
    
    // Test the file API endpoint
    const fileApiUrl = `http://localhost:3000/api/files/${encodeURIComponent(report.objectKey)}`;
    console.log(`🌐 Testing file API endpoint:`);
    console.log(`   URL: ${fileApiUrl}`);
    
    try {
      const response = await fetch(fileApiUrl, { method: 'HEAD' });
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log('✅ File API endpoint is working');
        
        // Check content type
        const contentType = response.headers.get('content-type');
        console.log(`   Content-Type: ${contentType || 'Not specified'}`);
        
        // Determine file type
        const fileName = report.objectKey.split('/').pop() || 'unknown';
        let fileType = 'unknown';
        
        if (contentType?.includes('image/') || fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
          fileType = 'image';
        } else if (contentType?.includes('pdf') || fileName.match(/\.pdf$/i)) {
          fileType = 'pdf';
        } else {
          fileType = 'other';
        }
        
        console.log(`   File Type: ${fileType}`);
        console.log(`   File Name: ${fileName}`);
        
        // Test the report detail page URL
        const reportDetailUrl = `http://localhost:3000/reports/${report.id}`;
        console.log(`\n📄 Report detail page:`);
        console.log(`   URL: ${reportDetailUrl}`);
        console.log(`   Expected preview: ${fileType === 'image' ? 'Image preview' : fileType === 'pdf' ? 'PDF preview' : 'Download only'}`);
        
      } else if (response.status === 404) {
        console.log('❌ File not found in storage');
      } else {
        console.log(`❌ File API error: ${response.status}`);
      }
      
    } catch (fetchError) {
      console.log(`❌ Failed to test file API: ${fetchError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing file preview:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testFilePreview().catch(console.error);