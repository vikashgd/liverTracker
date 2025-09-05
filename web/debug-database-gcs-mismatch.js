#!/usr/bin/env node

/**
 * Debug Database vs GCS Mismatch
 * 
 * Check what's in the database vs what's actually in GCS
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage
function initializeGCS() {
  const projectId = process.env.GCP_PROJECT_ID;
  const bucketName = process.env.GCS_BUCKET;
  const raw = process.env.GCP_SA_KEY;

  if (!projectId || !bucketName || !raw) {
    throw new Error("Missing GCS environment variables");
  }

  const credentials = typeof raw === "string" && raw.trim().startsWith("{") ? JSON.parse(raw) : raw;
  const storage = new Storage({ projectId, credentials });
  const bucket = storage.bucket(bucketName);

  return { storage, bucket, bucketName };
}

async function debugMismatch() {
  try {
    console.log('🔍 Database vs GCS Mismatch Analysis');
    console.log('=====================================\n');

    const { bucket, bucketName } = initializeGCS();
    console.log(`📁 Bucket: ${bucketName}\n`);

    // Get all files from GCS reports folder
    console.log('📊 Files in GCS reports/ folder:');
    const [files] = await bucket.getFiles({
      prefix: 'reports/',
      maxResults: 20
    });

    if (files.length === 0) {
      console.log('   ❌ No files found in reports/ folder');
    } else {
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name}`);
      });
    }

    console.log(`\n📈 Total files in GCS: ${files.length}\n`);

    // Check the specific problematic file
    const problematicFile = 'reports/1756926635007-423-yasoda 17 sep 4.pdf';
    console.log('🎯 Checking problematic file:');
    console.log(`   File: ${problematicFile}`);
    
    const file = bucket.file(problematicFile);
    const [exists] = await file.exists();
    
    if (exists) {
      console.log('   ✅ EXISTS in GCS');
    } else {
      console.log('   ❌ MISSING from GCS');
      
      // Look for similar files
      const similarFiles = files.filter(f => 
        f.name.includes('yasoda') || 
        f.name.includes('1756926635007') ||
        f.name.includes('17 sep')
      );
      
      if (similarFiles.length > 0) {
        console.log('   🔍 Similar files found:');
        similarFiles.forEach(f => console.log(`      • ${f.name}`));
      } else {
        console.log('   🔍 No similar files found');
      }
    }

    console.log('\n🔍 Analysis:');
    console.log('   • The file exists in database but not in GCS');
    console.log('   • This suggests the upload process failed after database creation');
    console.log('   • Or the file was deleted from GCS but not from database');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugMismatch();