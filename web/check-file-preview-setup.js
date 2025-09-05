#!/usr/bin/env node

/**
 * Check File Preview Setup
 * 
 * This script checks if file preview is properly set up by:
 * 1. Finding reports with objectKey
 * 2. Checking file types
 * 3. Verifying component structure
 */

const { PrismaClient } = require('./src/generated/prisma');
const fs = require('fs');
const path = require('path');

async function checkFilePreviewSetup() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking file preview setup...\n');
    
    // Find reports with objectKey
    const reports = await prisma.reportFile.findMany({
      select: {
        id: true,
        objectKey: true,
        contentType: true,
        reportType: true,
        createdAt: true
      },
      take: 5
    });
    
    console.log(`📋 Found ${reports.length} reports total\n`);
    
    const reportsWithFiles = reports.filter(r => r.objectKey);
    console.log(`📁 Reports with files: ${reportsWithFiles.length}`);
    
    if (reportsWithFiles.length > 0) {
      console.log('\n📄 Sample reports with files:');
      reportsWithFiles.forEach((report, index) => {
        const fileName = report.objectKey.split('/').pop() || 'unknown';
        let fileType = 'unknown';
        
        if (report.contentType?.includes('image/') || fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
          fileType = 'image';
        } else if (report.contentType?.includes('pdf') || fileName.match(/\.pdf$/i)) {
          fileType = 'pdf';
        } else {
          fileType = 'other';
        }
        
        console.log(`   ${index + 1}. ${report.id.slice(-8)} - ${fileType} - ${fileName}`);
      });
    }
    
    // Check if file display components exist
    console.log('\n🧩 Checking file display components:');
    
    const componentPath = path.join(__dirname, 'src/components/file-display-components.tsx');
    if (fs.existsSync(componentPath)) {
      console.log('   ✅ file-display-components.tsx exists');
      
      const componentContent = fs.readFileSync(componentPath, 'utf8');
      const hasImageDisplay = componentContent.includes('FileImageDisplay');
      const hasPdfDisplay = componentContent.includes('FilePdfDisplay');
      const hasDownloadDisplay = componentContent.includes('FileDownloadDisplay');
      
      console.log(`   ✅ FileImageDisplay: ${hasImageDisplay ? 'Found' : 'Missing'}`);
      console.log(`   ✅ FilePdfDisplay: ${hasPdfDisplay ? 'Found' : 'Missing'}`);
      console.log(`   ✅ FileDownloadDisplay: ${hasDownloadDisplay ? 'Found' : 'Missing'}`);
    } else {
      console.log('   ❌ file-display-components.tsx not found');
    }
    
    // Check if PDF viewer exists
    const pdfViewerPath = path.join(__dirname, 'src/components/pdf-viewer.tsx');
    if (fs.existsSync(pdfViewerPath)) {
      console.log('   ✅ pdf-viewer.tsx exists');
    } else {
      console.log('   ❌ pdf-viewer.tsx not found');
    }
    
    // Check if file API route exists
    const fileApiPath = path.join(__dirname, 'src/app/api/files/[...path]/route.ts');
    if (fs.existsSync(fileApiPath)) {
      console.log('   ✅ File API route exists');
    } else {
      console.log('   ❌ File API route not found');
    }
    
    // Check report detail page
    const reportDetailPath = path.join(__dirname, 'src/app/reports/[id]/report-detail-client.tsx');
    if (fs.existsSync(reportDetailPath)) {
      console.log('   ✅ Report detail client exists');
      
      const detailContent = fs.readFileSync(reportDetailPath, 'utf8');
      const hasFilePreview = detailContent.includes('FileImageDisplay') || 
                            detailContent.includes('FilePdfDisplay') || 
                            detailContent.includes('FileDownloadDisplay');
      
      console.log(`   ${hasFilePreview ? '✅' : '❌'} File preview components used: ${hasFilePreview}`);
    } else {
      console.log('   ❌ Report detail client not found');
    }
    
    console.log('\n🎯 Summary:');
    if (reportsWithFiles.length > 0) {
      console.log(`   • ${reportsWithFiles.length} reports have files that can be previewed`);
      console.log(`   • File types: ${[...new Set(reportsWithFiles.map(r => {
        const fileName = r.objectKey.split('/').pop() || 'unknown';
        if (r.contentType?.includes('image/') || fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
          return 'image';
        } else if (r.contentType?.includes('pdf') || fileName.match(/\.pdf$/i)) {
          return 'pdf';
        } else {
          return 'other';
        }
      }))].join(', ')}`);
      
      const sampleReport = reportsWithFiles[0];
      console.log(`\n📍 To test file preview:`);
      console.log(`   1. Start the development server: npm run dev`);
      console.log(`   2. Visit: http://localhost:3000/reports/${sampleReport.id}`);
      console.log(`   3. Look for "Original Document" section with file preview`);
    } else {
      console.log('   • No reports with files found - upload a file first');
    }
    
  } catch (error) {
    console.error('❌ Error checking file preview setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkFilePreviewSetup().catch(console.error);