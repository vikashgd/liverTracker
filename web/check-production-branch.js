/**
 * Check Production Branch for Data
 * This script will help you connect to the production branch
 */

const { PrismaClient } = require('./src/generated/prisma');

async function checkProductionBranch() {
  console.log('🔍 CHECKING PRODUCTION BRANCH CONNECTION');
  console.log('=======================================\n');

  // Current connection analysis
  console.log('📋 CURRENT CONNECTION:');
  const currentUrl = process.env.DATABASE_URL;
  console.log(`   Current URL: ${currentUrl?.replace(/:[^:@]*@/, ':***@')}\n`);

  // Extract the base connection details
  if (currentUrl) {
    const url = new URL(currentUrl);
    console.log('🔗 CONNECTION DETAILS:');
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Current endpoint: ${url.hostname}`);
    
    // The production branch should have a different endpoint
    // Based on Neon's pattern, it might be the main/default endpoint
    console.log('\n💡 PRODUCTION BRANCH CONNECTION:');
    console.log('   To connect to production branch, you need to:');
    console.log('   1. Go to your Neon dashboard');
    console.log('   2. Click on the "production" branch');
    console.log('   3. Copy the connection string');
    console.log('   4. Update your DATABASE_URL');
    
    // Try to identify which branch we're on based on the endpoint
    if (url.hostname.includes('pooler')) {
      console.log('\n🎯 CURRENT BRANCH IDENTIFICATION:');
      console.log('   Your current connection appears to be using a pooler endpoint');
      console.log('   This suggests you might be on the development branch');
    }
  }

  // Test current connection
  const prisma = new PrismaClient();
  
  try {
    console.log('\n📊 CURRENT BRANCH DATA CHECK:');
    
    const userCount = await prisma.user.count();
    const reportCount = await prisma.reportFile.count();
    const metricCount = await prisma.extractedMetric.count();
    
    console.log(`   Users: ${userCount}`);
    console.log(`   Reports: ${reportCount}`);
    console.log(`   Metrics: ${metricCount}`);
    
    if (reportCount === 0) {
      console.log('\n🚨 CONFIRMATION: This branch has NO report data');
      console.log('   Your data is likely in the PRODUCTION branch');
    } else {
      console.log('\n✅ This branch has report data');
    }
    
    // Get users for comparison
    if (userCount > 0) {
      console.log('\n👥 USERS IN CURRENT BRANCH:');
      const users = await prisma.user.findMany({
        select: {
          email: true,
          name: true,
          createdAt: true,
          firstReportUploaded: true
        }
      });
      
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.name || 'No name'})`);
        console.log(`     Created: ${user.createdAt.toLocaleDateString()}`);
        console.log(`     Has reports: ${user.firstReportUploaded ? 'Yes' : 'No'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking current branch:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n🎯 NEXT STEPS TO RECOVER YOUR DATA:');
  console.log('===================================');
  console.log('1. 🌐 Go to your Neon dashboard');
  console.log('2. 🔄 Click on the "production" branch (the DEFAULT one)');
  console.log('3. 📋 Copy the connection string from the production branch');
  console.log('4. 🔧 Update your .env file with the production connection string');
  console.log('5. 🧪 Run this script again to verify you can see your data');
  console.log('\n💡 The production branch likely contains all your missing data!');
}

checkProductionBranch().catch(console.error);