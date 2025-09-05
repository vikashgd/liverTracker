/**
 * Test Production Connection with Different Variations
 */

const { PrismaClient } = require('./src/generated/prisma');

async function testProductionConnection() {
  console.log('🔍 TESTING PRODUCTION CONNECTION VARIATIONS');
  console.log('===========================================\n');

  // Test current connection
  console.log('📊 TESTING CURRENT CONNECTION:');
  console.log(`   URL: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')}\n`);

  const prisma = new PrismaClient();
  
  try {
    const userCount = await prisma.user.count();
    const reportCount = await prisma.reportFile.count();
    const metricCount = await prisma.extractedMetric.count();
    
    console.log(`   ✅ Connection successful`);
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   📄 Reports: ${reportCount}`);
    console.log(`   📊 Metrics: ${metricCount}`);
    
    if (reportCount > 0) {
      console.log('\n🎉 SUCCESS! Found your data!');
      
      const reports = await prisma.reportFile.findMany({
        take: 5,
        include: {
          user: { select: { email: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('\n📄 YOUR REPORTS:');
      reports.forEach((report, index) => {
        console.log(`   ${index + 1}. ${report.id}`);
        console.log(`      User: ${report.user.email}`);
        console.log(`      Type: ${report.reportType || 'Unknown'}`);
        console.log(`      Created: ${report.createdAt.toLocaleDateString()}`);
      });
      
      return;
    }
    
    // If no reports, check database info
    console.log('\n🔍 DATABASE INFORMATION:');
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as db_name,
        current_user as user_name,
        inet_server_addr() as server_ip,
        version() as version
    `;
    
    console.log(`   Database: ${dbInfo[0].db_name}`);
    console.log(`   User: ${dbInfo[0].user_name}`);
    console.log(`   Server IP: ${dbInfo[0].server_ip || 'N/A'}`);
    console.log(`   Version: ${dbInfo[0].version.split(' ')[1]}`);
    
    // Check all databases
    try {
      const databases = await prisma.$queryRaw`
        SELECT datname, pg_size_pretty(pg_database_size(datname)) as size
        FROM pg_database 
        WHERE datistemplate = false
      `;
      
      console.log('\n🗄️ ALL DATABASES:');
      databases.forEach(db => {
        console.log(`   - ${db.datname}: ${db.size}`);
      });
    } catch (error) {
      console.log('   ❌ Cannot list databases');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n💡 TROUBLESHOOTING STEPS:');
  console.log('=========================');
  console.log('1. 🌐 In your Neon dashboard, click on "production" branch');
  console.log('2. 📋 Look for the exact connection string');
  console.log('3. 🔍 Check if the production branch has a different endpoint format');
  console.log('4. 🔗 The connection string might be:');
  console.log('   - postgresql://neondb_owner:***@ep-snowy-breeze-aeq72f7j.c-2.us-east-2.aws.neon.tech/neondb');
  console.log('   - Or it might have a different format entirely');
  console.log('\n🎯 If you can share the exact production connection string from');
  console.log('   your Neon dashboard, I can help you connect to your data!');
}

testProductionConnection().catch(console.error);