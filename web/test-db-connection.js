const { PrismaClient } = require('./src/generated/prisma');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing production database connection...');
    
    // Try a simple query to wake up the database
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful!');
    
    // Try to get basic info about existing tables
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('\n📊 Tables in database:');
    result.forEach(row => console.log(`   - ${row.table_name}`));
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n💡 Possible solutions:');
      console.log('   1. The Neon database might be paused (free tier auto-pauses)');
      console.log('   2. Try visiting the Neon dashboard to wake it up');
      console.log('   3. Check if the database URL is correct');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();