#!/usr/bin/env node

/**
 * Manual database migration script
 * Run this to add unit conversion fields when database is available
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Starting database migration...');
    
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../prisma/migrations/manual_add_unit_conversion_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} migration statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
          await prisma.$executeRawUnsafe(statement);
        } catch (error) {
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`   ⚠️  Skipped (already exists): ${statement.substring(0, 50)}...`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('🔄 Regenerating Prisma client...');
    
    // Note: In a real scenario, you'd run `npx prisma generate` after this
    console.log('📝 Please run: npx prisma generate');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };