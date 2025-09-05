/**
 * Emergency Database Connection Fix
 * Wake up Neon database and test connection
 */

const { PrismaClient } = require('./src/generated/prisma');

async function fixDatabaseConnection() {
  console.log('🚨 EMERGENCY DATABASE CONNECTION FIX');
  console.log('====================================\n');

  console.log('📋 Current connection string:');
  console.log(`   ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')}\n`);

  console.log('🔄 Attempting to wake up Neon database...');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  let retryCount = 0;
  const maxRetries = 5;

  while (retryCount < maxRetries) {
    try {
      console.log(`   Attempt ${retryCount + 1}/${maxRetries}...`);
      
      // Simple connection test
      await prisma.$queryRaw`SELECT 1 as test`;
      
      console.log('   ✅ Database connection successful!\n');
      
      // Test basic operations
      console.log('🧪 Testing basic operations:');
      
      const userCount = await prisma.user.count();
      console.log(`   👥 Users: ${userCount}`);
      
      const reportCount = await prisma.reportFile.count();
      console.log(`   📄 Reports: ${reportCount}`);
      
      console.log('\n🎉 Database is now active and ready!');
      console.log('   You can now refresh your browser and the dashboard should work.');
      
      break;
      
    } catch (error) {
      retryCount++;
      console.log(`   ❌ Attempt ${retryCount} failed: ${error.message}`);
      
      if (retryCount < maxRetries) {
        console.log(`   ⏳ Waiting 3 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.log('\n🚨 All connection attempts failed!');
        console.log('   This might indicate:');
        console.log('   1. Neon database is down');
        console.log('   2. Connection string is incorrect');
        console.log('   3. Network connectivity issues');
        console.log('\n💡 Try:');
        console.log('   1. Check your Neon dashboard');
        console.log('   2. Verify the connection string');
        console.log('   3. Wait a few minutes and try again');
      }
    }
  }

  await prisma.$disconnect();
}

fixDatabaseConnection().catch(console.error);