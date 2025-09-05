/**
 * Simple database connection test
 */

const { PrismaClient } = require('./src/generated/prisma');

async function testDbConnection() {
  console.log('🔍 Testing database connection...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);
    
    // Test reportFile table
    const reportCount = await prisma.reportFile.count();
    console.log('✅ ReportFile table accessible, count:', reportCount);
    
    // Test user table
    const userCount = await prisma.user.count();
    console.log('✅ User table accessible, count:', userCount);
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDbConnection().catch(console.error);