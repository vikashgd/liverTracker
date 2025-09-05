/**
 * Detailed Schema and Data Check
 */

const { PrismaClient } = require('./src/generated/prisma');

async function detailedCheck() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 DETAILED SCHEMA AND DATA CHECK');
    console.log('==================================\n');

    // Check all tables in public schema
    console.log('📊 ALL TABLES IN PUBLIC SCHEMA:');
    const allTables = await prisma.$queryRaw`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`   Found ${allTables.length} tables:`);
    allTables.forEach(table => {
      console.log(`   - ${table.table_name} (${table.table_type})`);
    });
    
    console.log('\n📋 TABLE STRUCTURE CHECK:');
    
    // Check each table individually with proper error handling
    const expectedTables = ['User', 'Account', 'Session', 'ReportFile', 'ExtractedMetric', 'UserProfile'];
    
    for (const tableName of expectedTables) {
      console.log(`\n   🔍 Checking table: ${tableName}`);
      
      // Check if table exists
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ) as exists
      `;
      
      if (tableExists[0].exists) {
        console.log(`      ✅ Table exists`);
        
        // Get column info
        try {
          const columns = await prisma.$queryRaw`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = ${tableName}
            ORDER BY ordinal_position
          `;
          console.log(`      📋 Columns (${columns.length}): ${columns.map(c => c.column_name).join(', ')}`);
          
          // Try to count rows with better error handling
          try {
            const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${prisma.$queryRawUnsafe(`"${tableName}"`)};`;
            console.log(`      📊 Row count: ${result[0].count}`);
          } catch (countError) {
            console.log(`      ❌ Error counting rows: ${countError.message}`);
          }
          
        } catch (columnError) {
          console.log(`      ❌ Error getting columns: ${columnError.message}`);
        }
      } else {
        console.log(`      ❌ Table does not exist`);
      }
    }
    
    // Check Prisma migrations
    console.log('\n🔄 PRISMA MIGRATIONS CHECK:');
    try {
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at, applied_steps_count
        FROM _prisma_migrations 
        ORDER BY finished_at DESC
      `;
      
      console.log(`   📋 Applied migrations: ${migrations.length}`);
      migrations.forEach(migration => {
        console.log(`   - ${migration.migration_name} (${migration.applied_steps_count} steps)`);
      });
    } catch (migrationError) {
      console.log(`   ❌ Error checking migrations: ${migrationError.message}`);
    }
    
    // Test basic Prisma operations
    console.log('\n🧪 PRISMA OPERATIONS TEST:');
    try {
      const userCount = await prisma.user.count();
      console.log(`   ✅ User count via Prisma: ${userCount}`);
      
      const reportCount = await prisma.reportFile.count();
      console.log(`   ✅ ReportFile count via Prisma: ${reportCount}`);
      
      const metricCount = await prisma.extractedMetric.count();
      console.log(`   ✅ ExtractedMetric count via Prisma: ${metricCount}`);
      
    } catch (prismaError) {
      console.log(`   ❌ Prisma operations error: ${prismaError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Detailed check error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

detailedCheck().catch(console.error);