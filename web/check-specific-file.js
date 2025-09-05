#!/usr/bin/env node

/**
 * Check Specific File in GCS
 * 
 * Quick diagnostic script to check if a specific file exists in Google Cloud Storage
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
    throw new Error("Missing GCS environment variables: GCP_PROJECT_ID, GCS_BUCKET, GCP_SA_KEY");
  }

  const credentials = typeof raw === "string" && raw.trim().startsWith("{") ? JSON.parse(raw) : raw;
  const storage = new Storage({ projectId, credentials });
  const bucket = storage.bucket(bucketName);

  return { storage, bucket, bucketName };
}

async function checkFile(objectKey) {
  try {
    const { bucket, bucketName } = initializeGCS();
    
    console.log('🔍 Checking file in Google Cloud Storage');
    console.log(`📁 Bucket: ${bucketName}`);
    console.log(`📄 File: ${objectKey}`);
    console.log('');

    const file = bucket.file(objectKey);
    
    // Check if file exists
    const [exists] = await file.exists();
    
    if (exists) {
      console.log('✅ FILE EXISTS');
      
      // Get file metadata
      try {
        const [metadata] = await file.getMetadata();
        console.log('📊 File Details:');
        console.log(`   Size: ${metadata.size} bytes`);
        console.log(`   Content Type: ${metadata.contentType}`);
        console.log(`   Created: ${metadata.timeCreated}`);
        console.log(`   Updated: ${metadata.updated}`);
      } catch (metaError) {
        console.log('⚠️  Could not get file metadata:', metaError.message);
      }
      
    } else {
      console.log('❌ FILE DOES NOT EXIST');
      console.log('');
      console.log('🔍 Possible reasons:');
      console.log('   • File was never uploaded');
      console.log('   • File was deleted from GCS');
      console.log('   • File path/name is incorrect');
      console.log('   • GCS credentials/bucket configuration issue');
      
      // List similar files
      console.log('');
      console.log('🔍 Looking for similar files...');
      
      try {
        const [files] = await bucket.getFiles({
          prefix: 'reports/',
          maxResults: 10
        });
        
        if (files.length > 0) {
          console.log('📁 Recent files in reports/ folder:');
          files.slice(0, 5).forEach(f => {
            console.log(`   • ${f.name}`);
          });
          if (files.length > 5) {
            console.log(`   ... and ${files.length - 5} more files`);
          }
        } else {
          console.log('📁 No files found in reports/ folder');
        }
      } catch (listError) {
        console.log('⚠️  Could not list files:', listError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking file:', error.message);
    
    if (error.message.includes('GCS env vars missing')) {
      console.log('');
      console.log('🔧 Make sure these environment variables are set:');
      console.log('   • GCP_PROJECT_ID');
      console.log('   • GCS_BUCKET');
      console.log('   • GCP_SA_KEY');
    }
  }
}

// Get file path from command line or use the problematic one
const objectKey = process.argv[2] || 'reports/1756926635007-423-yasoda 17 sep 4.pdf';

console.log('🔍 GCS File Checker');
console.log('===================\n');

checkFile(objectKey);