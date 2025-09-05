#!/usr/bin/env node

/**
 * Cleanup Orphaned File References
 * 
 * This script identifies and optionally removes database entries for files
 * that don't exist in Google Cloud Storage.
 */

const { PrismaClient } = require('@prisma/client');
const { Storage } = require('@google-cloud/storage');

const prisma = new PrismaClient();

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

  return { storage, bucket };
}

async function checkFileExists(bucket, objectKey) {
  try {
    const file = bucket.file(objectKey);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error(`Error checking file ${objectKey}:`, error.message);
    return false;
  }
}

async function findOrphanedFiles(dryRun = true) {
  console.log('🔍 Scanning for orphaned file references...\n');

  try {
    const { bucket } = initializeGCS();

    // Get all reports with file references
    const reports = await prisma.reportFile.findMany({
      where: {
        objectKey: {
          not: null
        }
      },
      select: {
        id: true,
        objectKey: true,
        createdAt: true,
        userId: true,
        _count: {
          select: { metrics: true }
        }
      }
    });

    console.log(`📊 Found ${reports.length} reports with file references`);

    const orphanedFiles = [];
    const existingFiles = [];

    // Check each file
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      const progress = `[${i + 1}/${reports.length}]`;
      
      process.stdout.write(`${progress} Checking ${report.objectKey}... `);

      const exists = await checkFileExists(bucket, report.objectKey);
      
      if (exists) {
        console.log('✅ EXISTS');
        existingFiles.push(report);
      } else {
        console.log('❌ MISSING');
        orphanedFiles.push(report);
      }
    }

    console.log('\n📋 SUMMARY:');
    console.log(`✅ Files that exist: ${existingFiles.length}`);
    console.log(`❌ Orphaned references: ${orphanedFiles.length}`);

    if (orphanedFiles.length > 0) {
      console.log('\n🗑️  ORPHANED FILES:');
      orphanedFiles.forEach(report => {
        console.log(`  • ${report.objectKey}`);
        console.log(`    - Report ID: ${report.id}`);
        console.log(`    - Created: ${report.createdAt.toISOString()}`);
        console.log(`    - Metrics: ${report._count.metrics}`);
        console.log('');
      });

      if (dryRun) {
        console.log('🔧 RECOMMENDED ACTIONS:');
        console.log('1. Run with --fix to remove orphaned database entries');
        console.log('2. Or manually investigate why these files are missing');
        console.log('\nTo fix: node cleanup-orphaned-files.js --fix');
      } else {
        console.log('🔧 FIXING ORPHANED REFERENCES...');
        
        for (const report of orphanedFiles) {
          try {
            // Option 1: Remove the objectKey reference but keep the report
            await prisma.reportFile.update({
              where: { id: report.id },
              data: { objectKey: null }
            });
            console.log(`✅ Cleared objectKey for report ${report.id}`);
            
            // Option 2: If you want to delete the entire report (uncomment below)
            // await prisma.reportFile.delete({
            //   where: { id: report.id }
            // });
            // console.log(`🗑️  Deleted report ${report.id}`);
            
          } catch (error) {
            console.error(`❌ Failed to fix report ${report.id}:`, error.message);
          }
        }
        
        console.log(`\n✅ Fixed ${orphanedFiles.length} orphaned references`);
      }
    } else {
      console.log('\n🎉 No orphaned files found! Database is consistent with GCS.');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = !args.includes('--fix');

if (args.includes('--help')) {
  console.log(`
Cleanup Orphaned File References

Usage:
  node cleanup-orphaned-files.js           # Dry run (scan only)
  node cleanup-orphaned-files.js --fix     # Fix orphaned references
  node cleanup-orphaned-files.js --help    # Show this help

What this script does:
- Scans all database entries with file references
- Checks if each file actually exists in Google Cloud Storage
- Reports orphaned references (database entries without files)
- Optionally fixes by clearing the objectKey field

Note: This script clears the objectKey field but keeps the report.
If you want to delete entire reports, modify the script.
`);
  process.exit(0);
}

console.log('🧹 File Reference Cleanup Tool');
console.log('================================\n');

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made');
} else {
  console.log('🔧 FIX MODE - Will update database');
}

console.log('');

findOrphanedFiles(dryRun);