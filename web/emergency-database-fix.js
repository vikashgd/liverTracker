/**
 * Emergency Database Connection Fix
 * Fixes Prisma client constructor validation errors
 */

const { PrismaClient } = require('./src/generated/prisma');

async function emergencyDatabaseFix() {
  console.log('🚨 EMERGENCY DATABASE CONNECTION FIX');
  console.log('===================================\n');

  let prisma;
  
  try {
    // Test basic Prisma connection
    console.log('🔍 Testing Prisma client connection...');
    prisma = new PrismaClient();
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Prisma client connected successfully');
    
    // Test a simple query
    console.log('🔍 Testing simple database query...');
    const userCount = await prisma.user.count();
    console.log(`✅ Database query successful - Found ${userCount} users`);
    
    // Test reports API functionality
    console.log('🔍 Testing reports functionality...');
    const reportCount = await prisma.reportFile.count();
    console.log(`✅ Reports query successful - Found ${reportCount} reports`);
    
    console.log('\n🎉 Database connection is working properly!');
    console.log('The issue might be in the API routes or environment variables.');
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    
    if (error.message.includes('PrismaClientConstructorValidationError')) {
      console.log('\n🔧 FIXING: Prisma client constructor validation error');
      console.log('This is likely due to environment variable issues.');
      
      // Check environment variables
      console.log('\n📋 Environment Variables Check:');
      console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
      console.log('DATABASE_URL starts with postgres:', process.env.DATABASE_URL?.startsWith('postgres'));
      
      if (!process.env.DATABASE_URL) {
        console.log('❌ DATABASE_URL is missing!');
        console.log('Please check your .env file');
      }
    }
    
    if (error.message.includes('Connection string')) {
      console.log('\n🔧 FIXING: Database connection string issue');
      console.log('The DATABASE_URL format might be incorrect.');
    }
    
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

emergencyDatabaseFix();