#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('./src/generated/prisma');

async function fixDatabaseConnection() {
  console.log('🔧 Fixing database connection issues...');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    console.log('🔄 Step 1: Testing basic connection...');
    
    // Simple connection test with timeout
    const connectionTest = prisma.$queryRaw`SELECT 1 as test`;
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 30000)
    );
    
    await Promise.race([connectionTest, timeoutPromise]);
    console.log('✅ Basic connection successful!');
    
    console.log('🔄 Step 2: Testing user table access...');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    console.log('🔄 Step 3: Testing report table access...');
    const reportCount = await prisma.reportFile.count();
    console.log(`✅ Found ${reportCount} reports in database`);
    
    console.log('🔄 Step 4: Testing metrics table access...');
    const metricCount = await prisma.extractedMetric.count();
    console.log(`✅ Found ${metricCount} metrics in database`);
    
    console.log('\n🎉 Database connection is working properly!');
    console.log('💡 Your Neon database is now active and ready to use.');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.message.includes('connection pool') || error.message.includes('timeout')) {
      console.log('\n🚨 Connection Pool Issue Detected!');
      console.log('📋 Solutions:');
      console.log('1. Visit https://console.neon.tech/ to wake up your database');
      console.log('2. Wait 2-3 minutes for the database to fully start');
      console.log('3. Consider upgrading to a paid plan to avoid auto-pause');
      console.log('4. Reduce concurrent connections in your app');
    }
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n🚨 Database Server Unreachable!');
      console.log('📋 Solutions:');
      console.log('1. Check if your Neon database is paused');
      console.log('2. Visit your Neon dashboard to activate it');
      console.log('3. Verify your DATABASE_URL is correct');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabaseConnection();