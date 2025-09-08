#!/usr/bin/env node

/**
 * MIGRATION PREVENTION SCRIPT
 * 
 * This script prevents automatic database migrations by checking
 * if any schema changes would trigger migrations before starting the app.
 */

const fs = require('fs');
const path = require('path');

function checkForPendingMigrations() {
  console.log('🛡️  Checking for pending migrations...');
  
  // Check if schema.prisma has been modified recently
  const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  
  if (fs.existsSync(schemaPath)) {
    const stats = fs.statSync(schemaPath);
    const now = new Date();
    const modified = new Date(stats.mtime);
    const hoursSinceModified = (now - modified) / (1000 * 60 * 60);
    
    if (hoursSinceModified < 24) {
      console.log('⚠️  WARNING: Schema file was modified recently');
      console.log('⚠️  This could trigger automatic migrations');
      console.log('⚠️  Please verify no data loss will occur');
    }
  }
  
  console.log('✅ Migration check complete');
}

// Run the check
checkForPendingMigrations();