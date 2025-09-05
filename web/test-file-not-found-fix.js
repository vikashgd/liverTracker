#!/usr/bin/env node

/**
 * Test File Not Found Fix
 * 
 * Quick test to verify that missing files are handled gracefully
 */

const { GCSStorage } = require('./src/lib/storage/gcs');

async function testMissingFile() {
  console.log('🧪 Testing File Not Found Fix');
  console.log('==============================\n');

  try {
    const storage = new GCSStorage();
    const missingFile = 'reports/1756926635007-423-yasoda 17 sep 4.pdf';
    
    console.log(`🔍 Testing missing file: ${missingFile}`);
    
    const result = await storage.signDownloadURL({ key: missingFile });
    
    if (result === null) {
      console.log('✅ SUCCESS: signDownloadURL returned null for missing file');
      console.log('✅ No error was thrown');
      console.log('✅ Fix is working correctly!');
    } else {
      console.log('❌ UNEXPECTED: signDownloadURL returned a result for missing file');
      console.log('Result:', result);
    }
    
  } catch (error) {
    console.log('❌ ERROR: signDownloadURL threw an error (should return null instead)');
    console.log('Error:', error.message);
    console.log('❌ Fix is not working correctly');
  }
}

testMissingFile();