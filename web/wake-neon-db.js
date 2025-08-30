#!/usr/bin/env node

const { PrismaClient } = require('./src/generated/prisma');

async function wakeUpDatabase() {
  const prisma = new PrismaClient();
  
  console.log('🔄 Attempting to wake up Neon database...');
  
  try {
    // Simple query to wake up the database
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database is awake and responding!');
    console.log('Test query result:', result);
    
    // Test user count
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    // Test report count
    const reportCount = await prisma.reportFile.count();
    console.log(`📋 Total reports in database: ${reportCount}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n💡 Solutions:');
      console.log('1. Visit your Neon dashboard: https://console.neon.tech/');
      console.log('2. Click on your project to wake it up');
      console.log('3. Wait 30-60 seconds and try again');
      console.log('4. Consider upgrading to a paid plan to avoid auto-pause');
    }
  } finally {
    await prisma.$disconnect();
  }
}

wakeUpDatabase();