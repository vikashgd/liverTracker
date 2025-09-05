/**
 * Wake up the database and check for any data
 */

const { PrismaClient } = require('./src/generated/prisma');

async function wakeAndCheckDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Waking up database...');
    
    // Simple ping to wake up the database
    await prisma.$queryRaw`SELECT 1 as ping`;
    console.log('✅ Database is awake');
    
    // Wait a moment for full connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check total counts
    const userCount = await prisma.user.count();
    const reportCount = await prisma.reportFile.count();
    const metricCount = await prisma.extractedMetric.count();
    
    console.log('\n📊 Database Summary:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Reports: ${reportCount}`);
    console.log(`   Metrics: ${metricCount}`);
    
    if (userCount > 0) {
      console.log('\n👥 All Users:');
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          _count: {
            select: {
              reportFiles: true
            }
          }
        }
      });
      
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.name}) - ${user._count.reportFiles} reports`);
      });
    }
    
    if (reportCount > 0) {
      console.log('\n📄 All Reports:');
      const reports = await prisma.reportFile.findMany({
        select: {
          id: true,
          objectKey: true,
          reportType: true,
          createdAt: true,
          user: {
            select: {
              email: true
            }
          }
        },
        take: 10
      });
      
      reports.forEach(report => {
        console.log(`   - ${report.objectKey} (${report.user.email}) - ${report.createdAt.toDateString()}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('connection')) {
      console.log('\n💡 This looks like a connection issue.');
      console.log('   The database might be sleeping or there might be network issues.');
      console.log('   Try running the script again in a few seconds.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

wakeAndCheckDatabase();