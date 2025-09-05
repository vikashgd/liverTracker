/**
 * Comprehensive Database Environment Analysis
 * This script helps identify production vs development database setup
 */

const { PrismaClient } = require('./src/generated/prisma');

async function analyzeEnvironment() {
  console.log('🔍 DATABASE ENVIRONMENT ANALYSIS');
  console.log('=====================================\n');

  // Current configuration analysis
  console.log('📋 CURRENT CONFIGURATION:');
  console.log(`   Database URL: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')}`);
  console.log(`   NextAuth URL: ${process.env.NEXTAUTH_URL}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);

  const prisma = new PrismaClient();
  
  try {
    // Database connection info
    console.log('🔗 DATABASE CONNECTION INFO:');
    const currentDb = await prisma.$queryRaw`SELECT current_database() as db_name`;
    const currentUser = await prisma.$queryRaw`SELECT current_user as user_name`;
    const serverVersion = await prisma.$queryRaw`SELECT version() as version`;
    
    console.log(`   Connected to database: ${currentDb[0].db_name}`);
    console.log(`   Connected as user: ${currentUser[0].user_name}`);
    console.log(`   PostgreSQL version: ${serverVersion[0].version.split(' ')[1]}\n`);

    // Check all databases in this Neon instance
    console.log('🗄️ ALL DATABASES IN NEON INSTANCE:');
    try {
      const databases = await prisma.$queryRaw`
        SELECT datname as database_name, 
               pg_size_pretty(pg_database_size(datname)) as size
        FROM pg_database 
        WHERE datistemplate = false
        ORDER BY datname
      `;
      
      for (const db of databases) {
        console.log(`   📊 ${db.database_name} (${db.size})`);
        
        // For each database, try to check if it has LiverTracker tables
        if (db.database_name !== currentDb[0].db_name) {
          console.log(`      ⚠️  Not currently connected - cannot check tables`);
        }
      }
    } catch (error) {
      console.log('   ❌ Cannot list databases (permission restricted)');
    }
    
    console.log('\n📊 CURRENT DATABASE ANALYSIS:');
    
    // Check schemas
    const schemas = await prisma.$queryRaw`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    `;
    console.log(`   Schemas: ${schemas.map(s => s.schema_name).join(', ')}`);
    
    // Check LiverTracker tables
    const liverTrackerTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name IN ('User', 'Account', 'Session', 'ReportFile', 'ExtractedMetric', 'UserProfile')
      ORDER BY table_name
    `;
    
    console.log(`\n   📋 LiverTracker Tables Found: ${liverTrackerTables.length}/6`);
    
    // Check data in each table
    console.log('\n   📈 DATA ANALYSIS:');
    const tableData = {};
    
    for (const table of liverTrackerTables) {
      try {
        const count = await prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM ${prisma.$queryRawUnsafe(`"${table.table_name}"`)}
        `;
        tableData[table.table_name] = parseInt(count[0].count);
        console.log(`      ${table.table_name}: ${count[0].count} rows`);
      } catch (error) {
        console.log(`      ${table.table_name}: Error counting rows`);
      }
    }
    
    // Analysis summary
    console.log('\n🎯 ENVIRONMENT ANALYSIS SUMMARY:');
    console.log('=====================================');
    
    if (liverTrackerTables.length === 6) {
      console.log('   ✅ All LiverTracker tables exist');
    } else {
      console.log('   ❌ Missing LiverTracker tables');
    }
    
    if (tableData.User > 0) {
      console.log(`   ✅ ${tableData.User} users exist`);
    } else {
      console.log('   ❌ No users found');
    }
    
    if (tableData.ReportFile > 0) {
      console.log(`   ✅ ${tableData.ReportFile} reports exist`);
    } else {
      console.log('   ⚠️  NO REPORTS FOUND - This appears to be a fresh/empty database');
    }
    
    // Environment determination
    console.log('\n🔍 ENVIRONMENT DETERMINATION:');
    if (tableData.ReportFile === 0 && tableData.User > 0) {
      console.log('   📊 This appears to be a DEVELOPMENT/TESTING database');
      console.log('   💡 Users exist but no actual report data has been uploaded');
      console.log('   🎯 This is likely the correct setup for development');
    } else if (tableData.ReportFile > 0) {
      console.log('   📊 This appears to be a PRODUCTION database with real data');
    } else {
      console.log('   📊 This appears to be a completely fresh database');
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('=====================================');
    
    if (tableData.ReportFile === 0) {
      console.log('   1. 🧪 Test the upload functionality by uploading a sample report');
      console.log('   2. 🔍 Verify the upload process works end-to-end');
      console.log('   3. 📊 Check if reports appear in the dashboard after upload');
      console.log('   4. 🎯 This database is ready for use - it just needs data');
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('   5. 🚀 For production deployment, consider:');
      console.log('      - Creating a separate production database');
      console.log('      - Using different environment variables for prod vs dev');
      console.log('      - Setting up proper backup procedures');
    }
    
  } catch (error) {
    console.error('❌ Analysis Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeEnvironment().catch(console.error);