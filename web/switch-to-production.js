/**
 * Switch to Production Branch Helper
 * This script will help you test the production branch connection
 */

const { PrismaClient } = require('./src/generated/prisma');
const fs = require('fs');

async function switchToProduction() {
  console.log('🔄 PRODUCTION BRANCH CONNECTION HELPER');
  console.log('======================================\n');

  console.log('📋 INSTRUCTIONS TO GET PRODUCTION CONNECTION STRING:');
  console.log('1. 🌐 Go to your Neon dashboard (https://console.neon.tech)');
  console.log('2. 🔄 Click on the "production" branch (the DEFAULT one with 31.56 MB)');
  console.log('3. 📋 Look for "Connection string" section');
  console.log('4. 🔗 Copy the connection string (it should be different from current one)');
  console.log('5. 📝 The production connection string should look like:');
  console.log('   postgresql://neondb_owner:***@ep-snowy-breeze-aeq72f7j.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require');
  console.log('   (Notice: NO "pooler" in the hostname for production branch)\n');

  // Show current connection for comparison
  console.log('🔍 CURRENT CONNECTION (Development Branch):');
  const currentUrl = process.env.DATABASE_URL;
  console.log(`   ${currentUrl?.replace(/:[^:@]*@/, ':***@')}\n`);

  // Test current connection
  console.log('📊 CURRENT BRANCH STATUS:');
  const prisma = new PrismaClient();
  
  try {
    const userCount = await prisma.user.count();
    const reportCount = await prisma.reportFile.count();
    const metricCount = await prisma.extractedMetric.count();
    
    console.log(`   ✅ Connected successfully`);
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   📄 Reports: ${reportCount}`);
    console.log(`   📊 Metrics: ${metricCount}`);
    
    if (reportCount > 0) {
      console.log('\n🎉 SUCCESS! You are now connected to the branch with data!');
      
      // Show some sample data
      const reports = await prisma.reportFile.findMany({
        take: 3,
        include: {
          user: {
            select: { email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('\n📄 SAMPLE REPORTS FOUND:');
      reports.forEach((report, index) => {
        console.log(`   ${index + 1}. Report ID: ${report.id}`);
        console.log(`      User: ${report.user.email}`);
        console.log(`      Type: ${report.reportType || 'Unknown'}`);
        console.log(`      Date: ${report.createdAt.toLocaleDateString()}`);
      });
      
      const metrics = await prisma.extractedMetric.count();
      console.log(`\n📊 Total extracted metrics: ${metrics}`);
      
    } else {
      console.log('\n⚠️  Still no reports found. You may need to update the DATABASE_URL.');
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🔧 TO UPDATE YOUR CONNECTION:');
  console.log('=============================');
  console.log('1. Copy the production branch connection string from Neon dashboard');
  console.log('2. Update your .env file:');
  console.log('   DATABASE_URL="<production-connection-string>"');
  console.log('3. Run this script again to verify the connection');
  console.log('\n💡 The production connection string should NOT have "pooler" in the hostname');
  console.log('   Development: ep-snowy-breeze-aeq72f7j-pooler.c-2.us-east-2.aws.neon.tech');
  console.log('   Production:  ep-snowy-breeze-aeq72f7j.c-2.us-east-2.aws.neon.tech');
}

switchToProduction().catch(console.error);