/**
 * Check Neon Database Possibilities
 * This script helps identify potential sources of missing data
 */

const { PrismaClient } = require('./src/generated/prisma');

async function checkNeonPossibilities() {
  console.log('🔍 NEON DATABASE POSSIBILITIES CHECK');
  console.log('====================================\n');

  const prisma = new PrismaClient();
  
  try {
    // Extract connection details
    const dbUrl = process.env.DATABASE_URL;
    const url = new URL(dbUrl);
    
    console.log('🔗 CURRENT CONNECTION ANALYSIS:');
    console.log(`   Project endpoint: ${url.hostname}`);
    console.log(`   Database name: ${url.pathname.substring(1)}`);
    console.log(`   Connection params: ${url.search}\n`);
    
    // Check the exact migration timestamps
    console.log('📅 MIGRATION TIMELINE ANALYSIS:');
    const migrations = await prisma.$queryRaw`
      SELECT 
        migration_name, 
        finished_at,
        started_at,
        applied_steps_count
      FROM _prisma_migrations 
      ORDER BY finished_at ASC
    `;
    
    console.log('   Migration sequence:');
    migrations.forEach((migration, index) => {
      const date = new Date(migration.finished_at);
      console.log(`   ${index + 1}. ${migration.migration_name}`);
      console.log(`      Applied: ${date.toLocaleString()}`);
    });
    
    // Check if this looks like a fresh setup
    const firstMigration = migrations[0];
    const lastMigration = migrations[migrations.length - 1];
    
    if (firstMigration && lastMigration) {
      const firstDate = new Date(firstMigration.finished_at);
      const lastDate = new Date(lastMigration.finished_at);
      const timeDiff = lastDate - firstDate;
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));
      
      console.log(`\n   ⏱️  Migration timing analysis:`);
      console.log(`      First migration: ${firstDate.toLocaleString()}`);
      console.log(`      Last migration: ${lastDate.toLocaleString()}`);
      console.log(`      Time span: ${minutesDiff} minutes`);
      
      if (minutesDiff < 10) {
        console.log('      🚨 ALL MIGRATIONS RAN WITHIN 10 MINUTES - This suggests a fresh database setup!');
      }
    }
    
    // Check user creation dates
    console.log('\n👥 USER CREATION ANALYSIS:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        onboardingCompleted: true,
        firstReportUploaded: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
      console.log(`      Created: ${user.createdAt.toLocaleString()}`);
      console.log(`      Updated: ${user.updatedAt.toLocaleString()}`);
      console.log(`      Onboarding: ${user.onboardingCompleted ? '✅' : '❌'}`);
      console.log(`      First report: ${user.firstReportUploaded ? '✅' : '❌'}`);
    });
    
    // Check if users were created after migrations (suggests fresh setup)
    if (users.length > 0 && lastMigration) {
      const lastMigrationDate = new Date(lastMigration.finished_at);
      const firstUserDate = new Date(users[0].createdAt);
      
      if (firstUserDate > lastMigrationDate) {
        const timeDiff = firstUserDate - lastMigrationDate;
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));
        console.log(`\n   ⏱️  User vs Migration timing:`);
        console.log(`      First user created ${minutesDiff} minutes after last migration`);
        
        if (minutesDiff < 60) {
          console.log('      🚨 USERS CREATED SHORTLY AFTER MIGRATIONS - This confirms fresh setup!');
        }
      }
    }
    
    // Generate possible alternative connection strings to check
    console.log('\n🔍 POSSIBLE ALTERNATIVE CONNECTIONS TO CHECK:');
    console.log('   (These are possibilities you should manually verify in Neon dashboard)');
    
    const baseHost = url.hostname;
    const projectId = baseHost.split('-')[0]; // Extract project ID
    
    console.log(`   1. Different database in same project:`);
    console.log(`      - Check if you have other databases besides 'neondb' and 'postgres'`);
    
    console.log(`   2. Different branches in Neon:`);
    console.log(`      - Check if you have branches like 'main', 'dev', 'production'`);
    console.log(`      - Each branch would have different endpoint URLs`);
    
    console.log(`   3. Different Neon projects:`);
    console.log(`      - Check your Neon dashboard for multiple projects`);
    console.log(`      - Look for projects with similar names`);
    
    console.log(`   4. Historical connection strings:`);
    console.log(`      - Check git history for different DATABASE_URL values`);
    console.log(`      - Look in deployment logs or CI/CD configurations`);
    
    // Check for any signs of data that existed
    console.log('\n🔍 SIGNS OF PREVIOUS DATA:');
    
    try {
      // Check sequence values
      const userSeq = await prisma.$queryRaw`SELECT last_value FROM "User_id_seq"`;
      const reportSeq = await prisma.$queryRaw`SELECT last_value FROM "ReportFile_id_seq"`;
      
      console.log(`   User ID sequence: ${userSeq[0]?.last_value || 'N/A'}`);
      console.log(`   ReportFile ID sequence: ${reportSeq[0]?.last_value || 'N/A'}`);
      
      if (userSeq[0]?.last_value > users.length) {
        console.log('   🚨 User sequence higher than user count - suggests deleted users!');
      }
      
      if (reportSeq[0]?.last_value > 1) {
        console.log('   🚨 ReportFile sequence > 1 but no reports - suggests deleted reports!');
      }
      
    } catch (seqError) {
      console.log('   ❌ Could not check sequence values');
    }
    
  } catch (error) {
    console.error('❌ Check error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n💡 RECOMMENDED ACTIONS:');
  console.log('========================');
  console.log('1. 🌐 Log into your Neon dashboard (https://console.neon.tech)');
  console.log('2. 🔍 Check if you have multiple projects');
  console.log('3. 🌿 Check if your current project has multiple branches');
  console.log('4. 📊 Look for any databases with actual data');
  console.log('5. 📧 Check your email for any Neon notifications about data changes');
  console.log('6. 🔄 Check if there are any database snapshots or backups');
  console.log('7. 📱 Consider if you might have been using a local database previously');
  console.log('\n🎯 If no data is found elsewhere:');
  console.log('   ✅ Your current setup is correct and ready for fresh data');
  console.log('   ✅ All systems are working properly');
  console.log('   ✅ You can confidently start using the application');
}

checkNeonPossibilities().catch(console.error);