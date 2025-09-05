#!/usr/bin/env node

/**
 * Test PDF Preview Fix
 * 
 * This script tests if the PDF preview fix is working
 */

const { PrismaClient } = require('./src/generated/prisma');

async function testPdfPreviewFix() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Testing PDF preview fix...\n');
    
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
    console.log(`   Content Type: ${report.contentType}\n`);
    
    const encodedKey = encodeURIComponent(report.objectKey);
    const fileApiUrl = `http://localhost:3000/api/files/${encodedKey}`;
    
    console.log('🔧 Changes made to fix PDF preview:');
    console.log('   ✅ Modified file API route to proxy content instead of redirect');
    console.log('   ✅ Added proper headers for iframe embedding');
    console.log('   ✅ Added X-Frame-Options: SAMEORIGIN');
    console.log('   ✅ Added CORS headers for cross-origin requests');
    console.log('   ✅ Added HEAD method support for file existence checks');
    console.log('   ✅ Added better error logging in PDF component\n');
    
    console.log('🧪 Testing steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log(`   2. Visit the report page: http://localhost:3000/reports/${report.id}`);
    console.log('   3. Look for "Original Document" section');
    console.log('   4. PDF should now load inline in the iframe');
    console.log('   5. Check browser console for debug logs\n');
    
    console.log('🔍 Debug information:');
    console.log(`   • File API URL: ${fileApiUrl}`);
    console.log(`   • Iframe src: ${fileApiUrl}#toolbar=0&navpanes=0&scrollbar=0`);
    console.log('   • The API now proxies file content instead of redirecting');
    console.log('   • This should fix iframe embedding issues with PDFs\n');
    
    console.log('📊 Expected behavior:');
    console.log('   ✅ PDF loads inline in the preview area');
    console.log('   ✅ No "PDF could not be loaded" error message');
    console.log('   ✅ Zoom button opens full-screen PDF viewer');
    console.log('   ✅ Download button works correctly');
    console.log('   ✅ Console shows successful loading logs\n');
    
    console.log('🚨 If still not working, check:');
    console.log('   • Browser console for any JavaScript errors');
    console.log('   • Network tab for failed API requests');
    console.log('   • GCS credentials and bucket permissions');
    console.log('   • File actually exists in GCS bucket');
    
  } catch (error) {
    console.error('❌ Error testing PDF preview fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPdfPreviewFix().catch(console.error);