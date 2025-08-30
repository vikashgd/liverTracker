#!/usr/bin/env node

const { PrismaClient } = require('./src/generated/prisma');

async function testAuthConnection() {
  const prisma = new PrismaClient();
  
  console.log('🔄 Testing database connection for authentication...');
  
  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful!');
    
    // Check if we have users
    const users = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });
    
    console.log(`📊 Found ${users.length} users in database`);
    if (users.length > 0) {
      console.log('Sample users:', users);
    }
    
    // Check accounts table for OAuth
    const accounts = await prisma.account.findMany({
      take: 3,
      select: {
        id: true,
        provider: true,
        type: true,
        userId: true
      }
    });
    
    console.log(`🔐 Found ${accounts.length} OAuth accounts`);
    if (accounts.length > 0) {
      console.log('Sample accounts:', accounts);
    }
    
    console.log('\n✅ Database is ready for authentication!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n🚨 Database is still paused. Please:');
      console.log('1. Visit https://console.neon.tech/');
      console.log('2. Click on your project');
      console.log('3. Wait 1-2 minutes');
      console.log('4. Run this script again');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testAuthConnection();