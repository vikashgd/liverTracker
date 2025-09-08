/**
 * Verification script to test if the trends fix is working
 */

const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function verifyTrendsFix() {
  try {
    console.log('🧪 Verifying trends fix...\n');

    // Find a user with data
    const user = await prisma.user.findFirst({
      include: {
        reportFiles: {
          include: {
            metrics: true
          },
          take: 3
        }
      }
    });

    if (!user || user.reportFiles.length === 0) {
      console.log('❌ No user with reports found for testing');
      console.log('💡 Please upload some lab reports first');
      return;
    }

    console.log(`👤 Testing with user: ${user.name} (${user.id})`);
    console.log(`📊 User has ${user.reportFiles.length} reports`);

    // Check available metrics
    const totalMetrics = user.reportFiles.reduce((sum, r) => sum + r.metrics.length, 0);
    console.log(`📈 Total metrics: ${totalMetrics}`);

    if (totalMetrics === 0) {
      console.log('❌ No metrics found for user');
      console.log('💡 Please ensure reports have been processed and metrics extracted');
      return;
    }

    // Show some sample metrics
    const sampleMetrics = user.reportFiles.flatMap(r => r.metrics).slice(0, 10);
    console.log('\n📊 Sample metrics:');
    sampleMetrics.forEach(metric => {
      console.log(`  ${metric.name}: ${metric.value} ${metric.unit || 'no unit'}`);
    });

    console.log('\n✅ Data looks good for testing trends!');
    console.log('\n🔧 To test the fix:');
    console.log(`1. Visit: http://localhost:3000/api/debug/trends?userId=${user.id}`);
    console.log('2. Create a share link and check if trends appear');
    console.log('3. Look for detailed logging in the browser console');
    console.log('\n📋 Expected behavior:');
    console.log('- Trends tab should show data instead of "No trend data available"');
    console.log('- Console should show detailed debugging information');
    console.log('- Fallback method should work if platform method fails');

  } catch (error) {
    console.error('💥 Error verifying fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTrendsFix();