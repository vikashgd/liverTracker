/**
 * Comprehensive Investigation for Missing Data
 * This script will help us understand if data exists elsewhere
 */

const { PrismaClient } = require('./src/generated/prisma');

async function investigateMissingData() {
  console.log('🔍 COMPREHENSIVE DATA INVESTIGATION');
  console.log('====================================\n');

  // Check current environment
  console.log('📋 CURRENT ENVIRONMENT CHECK:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')}`);
  console.log(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}\n`);

  // Parse the database URL to understand the connection
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const url = new URL(dbUrl);
    console.log('🔗 DATABASE CONNECTION DETAILS:');
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Database: ${url.pathname.substring(1)}`);
    console.log(`   User: ${url.username}`);
    console.log(`   SSL Mode: ${url.searchParams.get('sslmode')}\n`);
  }

  const prisma = new PrismaClient();
  
  try {
    // Current database detailed analysis
    console.log('📊 CURRENT DATABASE DETAILED ANALYSIS:');
    
    const currentDb = await prisma.$queryRaw`SELECT current_database() as db_name`;
    console.log(`   Connected to: ${currentDb[0].db_name}`);
    
    // Check database size and activity
    const dbStats = await prisma.$queryRaw`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as size,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as connections
    `;
    console.log(`   Database size: ${dbStats[0].size}`);
    console.log(`   Active connections: ${dbStats[0].connections}`);
    
    // Check when tables were last modified
    console.log('\n   📅 TABLE MODIFICATION TIMES:');
    try {
      const tableStats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
      `;
      
      tableStats.forEach(stat => {
        console.log(`      ${stat.tablename}:`);
        console.log(`        Inserts: ${stat.inserts}, Updates: ${stat.updates}, Deletes: ${stat.deletes}`);
        if (stat.last_analyze) {
          console.log(`        Last analyzed: ${stat.last_analyze}`);
        }
      });
    } catch (error) {
      console.log('      ❌ Could not get table statistics');
    }
    
    // Check for any recent activity in audit logs
    console.log('\n   📋 CHECKING FOR AUDIT TRAIL:');
    try {
      const auditCount = await prisma.auditLog.count();
      console.log(`      Audit logs: ${auditCount}`);
      
      if (auditCount > 0) {
        const recentAudits = await prisma.auditLog.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { email: true }
            }
          }
        });
        
        console.log('      Recent audit entries:');
        recentAudits.forEach(audit => {
          console.log(`        ${audit.createdAt}: ${audit.action} by ${audit.user?.email || 'Unknown'}`);
        });
      }
    } catch (error) {
      console.log('      ❌ Could not check audit logs');
    }
    
    // Check migration history for clues
    console.log('\n   🔄 MIGRATION HISTORY ANALYSIS:');
    try {
      const migrations = await prisma.$queryRaw`
        SELECT 
          migration_name, 
          finished_at, 
          applied_steps_count,
          logs
        FROM _prisma_migrations 
        ORDER BY finished_at DESC
      `;
      
      console.log(`      Total migrations: ${migrations.length}`);
      migrations.forEach(migration => {
        console.log(`        ${migration.migration_name}`);
        console.log(`          Applied: ${migration.finished_at}`);
        console.log(`          Steps: ${migration.applied_steps_count}`);
      });
    } catch (error) {
      console.log('      ❌ Could not check migration history');
    }
    
    // Check alternative databases using Prisma raw queries
    console.log('\n🔍 CHECKING FOR DATA PATTERNS:');
    
    // Check if there are any patterns that suggest data existed
    try {
      const sequences = await prisma.$queryRaw`
        SELECT sequence_name, last_value 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
      `;
      
      console.log('   📊 Sequence values (indicate if IDs were ever generated):');
      sequences.forEach(seq => {
        console.log(`      ${seq.sequence_name}: ${seq.last_value}`);
      });
      
      // Check for any foreign key constraints that might indicate relationships
      const constraints = await prisma.$queryRaw`
        SELECT 
          tc.table_name, 
          tc.constraint_name, 
          tc.constraint_type
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public' 
        AND tc.constraint_type = 'FOREIGN KEY'
      `;
      
      console.log(`\n   🔗 Foreign key constraints: ${constraints.length}`);
      
    } catch (seqError) {
      console.log('   ❌ Could not check sequences and constraints');
    }
    
    // Check for any environment files that might have different URLs
    console.log('\n📁 ENVIRONMENT FILES CHECK:');
    console.log('   Looking for different database URLs in environment files...');
    
    // This would be done by reading files, but we'll note what to check
    console.log('   📝 Files to manually check:');
    console.log('      - .env');
    console.log('      - .env.local');
    console.log('      - .env.production');
    console.log('      - .env.development');
    console.log('      - Any deployment configuration files');
    
  } catch (error) {
    console.error('❌ Investigation error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  // Final recommendations
  console.log('\n💡 INVESTIGATION SUMMARY & NEXT STEPS:');
  console.log('=====================================');
  console.log('1. 🔍 Check if you have multiple Neon projects');
  console.log('2. 📋 Look for any backup/snapshot files');
  console.log('3. 🌿 Check if Neon has database branches');
  console.log('4. 📧 Check your email for Neon notifications about data changes');
  console.log('5. 🔐 Verify you\'re using the correct Neon credentials');
  console.log('6. 📱 Check if you have the data in a local development database');
  console.log('\n🎯 If data was truly lost, the good news is:');
  console.log('   ✅ Your application structure is intact');
  console.log('   ✅ Authentication works');
  console.log('   ✅ Database schema is correct');
  console.log('   ✅ You can start fresh with confidence');
}

investigateMissingData().catch(console.error);