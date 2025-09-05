#!/usr/bin/env node

/**
 * Debug PDF Preview Issue
 * 
 * This script diagnoses why the PDF preview is not working
 */

const { PrismaClient } = require('./src/generated/prisma');

async function debugPdfPreview() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Debugging PDF preview issue...\n');
    
    // Find the specific report
    const report = await prisma.reportFile.findFirst({
      where: {
        objectKey: {
          contains: '1756967307128-210-YASODA'
        }
      }
    });
    
    if (!report) {
      console.log('❌ Report not found');
      return;
    }
    
    console.log('📋 Report details:');
    console.log(`   ID: ${report.id}`);
    console.log(`   Object Key: ${report.objectKey}`);
    console.log(`   Content Type: ${report.contentType}`);
    console.log(`   Bucket: livertrack-uploads`);
    console.log(`   Full GCS Path: gs://livertrack-uploads/${report.objectKey}\n`);
    
    // Test different URL formats
    const encodedKey = encodeURIComponent(report.objectKey);
    const fileApiUrl = `http://localhost:3000/api/files/${encodedKey}`;
    
    console.log('🌐 File API URL:');
    console.log(`   ${fileApiUrl}\n`);
    
    // Check if the issue is with the iframe src
    const iframeSrc = `${fileApiUrl}#toolbar=0&navpanes=0&scrollbar=0`;
    console.log('📄 Iframe src (what PDF preview uses):');
    console.log(`   ${iframeSrc}\n`);
    
    console.log('🔧 Potential issues to check:');
    console.log('   1. CORS headers for iframe embedding');
    console.log('   2. Content-Type header must be application/pdf');
    console.log('   3. X-Frame-Options header blocking iframe');
    console.log('   4. Google Cloud Storage signed URL configuration');
    console.log('   5. Browser security blocking cross-origin iframe\n');
    
    console.log('🧪 Manual testing steps:');
    console.log('   1. Start dev server: npm run dev');
    console.log(`   2. Open in browser: ${fileApiUrl}`);
    console.log('   3. Check if PDF opens directly');
    console.log('   4. Check browser console for errors');
    console.log('   5. Check network tab for failed requests\n');
    
    console.log('🔍 Check these files:');
    console.log('   • src/app/api/files/[...path]/route.ts - File serving logic');
    console.log('   • src/lib/storage/gcs.ts - GCS signed URL generation');
    console.log('   • src/components/file-display-components.tsx - PDF preview component');
    
  } catch (error) {
    console.error('❌ Error debugging PDF preview:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPdfPreview().catch(console.error);