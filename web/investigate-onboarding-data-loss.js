/**
 * Investigate Onboarding-Related Data Loss
 * Check if onboarding migrations or changes caused data deletion
 */

const { PrismaClient } = require('./src/generated/prisma');

async function investigateOnboardingDataLoss() {
  console.log('🔍 INVESTIGATING ONBOARDING-RELATED DATA LOSS');
  console.log('==============================================\n');

  const prisma = new PrismaClient();
  
  try {
    // Check migration timeline vs user creation timeline
    console.log('📅 MIGRATION vs USER TIMELINE ANALYSIS:');
    
    const migrations = await prisma.$queryRaw`
      SELECT 
        migration_name, 
        finished_at,
        started_at
      FROM _prisma_migrations 
      ORDER BY finished_at ASC
    `;
    
    const users = await prisma.user.findMany({
      select: {
        email: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('   🔄 Migration History:');
    migrations.forEach((migration, index) => {
      const date = new Date(migration.finished_at);
      console.log(`   ${index + 1}. ${migration.migration_name}`);
      console.log(`      Applied: ${date.toLocaleString()}`);
    });
    
    console.log('\n   👥 User Creation History:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
      console.log(`      Created: ${user.createdAt.toLocaleString()}`);
      console.log(`      Updated: ${user.updatedAt.toLocaleString()}`);
    });
    
    // Look for the onboarding migration specifically
    const onboardingMigration = migrations.find(m => 
      m.migration_name.includes('onboarding') || 
      m.migration_name.includes('user_onboarding')
    );
    
    if (onboardingMigration) {
      console.log('\n🎯 ONBOARDING MIGRATION FOUND:');
      console.log(`   Migration: ${onboardingMigration.migration_name}`);
      console.log(`   Applied: ${new Date(onboardingMigration.finished_at).toLocaleString()}`);
      
      // Check if users were created before this migration
      const migrationDate = new Date(onboardingMigration.finished_at);
      const usersBeforeMigration = users.filter(user => 
        new Date(user.createdAt) < migrationDate
      );
      
      if (usersBeforeMigration.length > 0) {
        console.log('\n🚨 POTENTIAL DATA LOSS SCENARIO DETECTED:');
        console.log(`   ${usersBeforeMigration.length} users existed BEFORE onboarding migration`);
        console.log('   This could indicate data was lost during migration!');
        
        usersBeforeMigration.forEach(user => {
          console.log(`   - ${user.email} (created ${user.createdAt.toLocaleDateString()})`);
        });
      } else {
        console.log('\n✅ Users were created AFTER onboarding migration');
        console.log('   This suggests no data loss from onboarding changes');
      }
    }
    
    // Check for any signs of deleted data
    console.log('\n🔍 CHECKING FOR SIGNS OF DELETED DATA:');
    
    // Check sequence values - if they're higher than current record count, it suggests deletions
    try {
      const sequences = await prisma.$queryRaw`
        SELECT 
          sequence_name,
          last_value,
          is_called
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
        AND sequence_name LIKE '%_id_seq'
      `;
      
      console.log('   📊 Sequence Analysis (high values suggest deleted records):');
      
      for (const seq of sequences) {
        const tableName = seq.sequence_name.replace('_id_seq', '');
        
        try {
          // Get current record count for this table
          const count = await prisma.$queryRaw`
            SELECT COUNT(*) as count 
            FROM ${prisma.$queryRawUnsafe(`"${tableName}"`)}
          `;
          
          const currentCount = parseInt(count[0].count);
          const sequenceValue = parseInt(seq.last_value);
          
          console.log(`   - ${tableName}:`);
          console.log(`     Current records: ${currentCount}`);
          console.log(`     Sequence value: ${sequenceValue}`);
          
          if (sequenceValue > currentCount && currentCount === 0) {
            console.log(`     🚨 SUSPICIOUS: Sequence suggests ${sequenceValue} records were created but table is empty!`);
          } else if (sequenceValue > currentCount) {
            console.log(`     ⚠️  Gap detected: ${sequenceValue - currentCount} records may have been deleted`);
          } else {
            console.log(`     ✅ Normal: Sequence matches record count`);
          }
          
        } catch (error) {
          console.log(`   - ${tableName}: Could not check (table may not exist)`);
        }
      }
      
    } catch (seqError) {
      console.log('   ❌ Could not check sequences');
    }
    
    // Check for any audit trail of deletions
    console.log('\n🔍 CHECKING AUDIT TRAIL:');
    try {
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: {
            contains: 'DELETE'
          }
        },
        include: {
          user: {
            select: { email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      if (auditLogs.length > 0) {
        console.log(`   🚨 Found ${auditLogs.length} deletion audit logs:`);
        auditLogs.forEach(log => {
          console.log(`   - ${log.createdAt.toLocaleString()}: ${log.action} by ${log.user?.email || 'System'}`);
          console.log(`     Details: ${log.details || 'No details'}`);
        });
      } else {
        console.log('   ✅ No deletion audit logs found');
      }
    } catch (auditError) {
      console.log('   ❌ Could not check audit logs');
    }
    
    // Check the onboarding migration file content
    console.log('\n📄 CHECKING ONBOARDING MIGRATION CONTENT:');
    if (onboardingMigration) {
      console.log('   Looking for the migration file to check what changes were made...');
      console.log(`   Migration file should be: prisma/migrations/${onboardingMigration.migration_name}/migration.sql`);
    }
    
  } catch (error) {
    console.error('❌ Investigation error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n🎯 INVESTIGATION SUMMARY:');
  console.log('=========================');
  console.log('If data loss occurred during onboarding implementation:');
  console.log('1. 🔍 Check sequence values vs record counts');
  console.log('2. 📅 Compare migration dates vs user creation dates');
  console.log('3. 📄 Review migration files for destructive operations');
  console.log('4. 🔄 Look for database resets or schema changes');
  console.log('\nNext: Check the actual migration files for evidence of data-destructive operations');
}

investigateOnboardingDataLoss().catch(console.error);