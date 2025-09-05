#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { GCSStorage } = require('./src/lib/storage/gcs');

async function testSignedUrl() {
  try {
    const objectKey = 'reports/1756967307128-210-YASODA 29-10-2020.pdf';
    
    console.log('🔍 Testing signed URL generation...');
    console.log(`📄 File: ${objectKey}\n`);
    
    const storage = new GCSStorage();
    const result = await storage.signDownloadURL({ key: objectKey });
    const signedUrl = result ? result.url : null;
    
    if (signedUrl) {
      console.log('✅ Signed URL generated successfully!');
      console.log(`🔗 URL: ${signedUrl.substring(0, 100)}...`);
      console.log(`📏 Full URL length: ${signedUrl.length} characters`);
      
      // Test if the URL is accessible
      console.log('\n🌐 Testing URL accessibility...');
      const response = await fetch(signedUrl, { method: 'HEAD' });
      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      console.log(`📦 Content-Type: ${response.headers.get('content-type')}`);
      console.log(`📏 Content-Length: ${response.headers.get('content-length')} bytes`);
      
      if (response.ok) {
        console.log('\n✅ File is accessible via signed URL!');
        console.log('   The file preview should work.');
      } else {
        console.log('\n❌ File is not accessible via signed URL');
        console.log('   This explains why preview is not working.');
      }
      
    } else {
      console.log('❌ Failed to generate signed URL');
      console.log('   This means the file was not found in GCS');
    }
    
  } catch (error) {
    console.error('❌ Error testing signed URL:', error.message);
  }
}

testSignedUrl();