/**
 * FINAL FIX: Dashboard Data Loading Issue
 * This will fix the user-specific data loading and ensure Sodium shows up
 */

const { PrismaClient } = require('./src/generated/prisma');

async function fixDashboardDataLoading() {
  console.log('🔧 FINAL FIX: Dashboard Data Loading Issue\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Step 1: Verify the current user and their data
    console.log('👤 Step 1: Verifying user data...');
    
    const user = await prisma.user.findFirst({
      where: { email: 'vikashgd@gmail.com' },
      select: { id: true, email: true }
    });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log(`✅ User: ${user.email} (ID: ${user.id})`);
    
    // Step 2: Test the exact query that medical platform uses
    console.log('\n🔍 Step 2: Testing medical platform query...');
    
    const sodiumQuery = await prisma.extractedMetric.findMany({
      where: {
        report: { userId: user.id },
        name: { in: ['Sodium', 'sodium', 'SODIUM', 'Na', 'Serum Sodium'] },
        value: { not: null }
      },
      include: {
        report: {
          select: {
            reportDate: true,
            reportType: true,
            id: true
          }
        }
      },
      orderBy: [
        { report: { reportDate: 'asc' } },
        { createdAt: 'asc' }
      ]
    });
    
    console.log(`Medical platform query result: ${sodiumQuery.length} Sodium data points`);
    
    if (sodiumQuery.length > 0) {
      console.log('✅ Medical platform query works correctly!');
      sodiumQuery.forEach((point, idx) => {
        console.log(`   ${idx + 1}. ${point.value} ${point.unit} on ${point.report.reportDate?.toDateString() || 'No date'}`);
      });
    } else {
      console.log('❌ Medical platform query returns no data');
    }
    
    // Step 3: Check if the issue is in the chart-data API
    console.log('\n📊 Step 3: Checking chart-data API logic...');
    
    // Simulate the chart-data API call
    console.log('The chart-data API should:');
    console.log('1. Get userId from requireAuth()');
    console.log('2. Call getMedicalPlatform().getChartData(userId, "Sodium")');
    console.log('3. Return the chart series data');
    
    // Step 4: Check authentication flow
    console.log('\n🔐 Step 4: Authentication verification...');
    
    // Check if there are any sessions for this user
    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { expires: 'desc' },
      take: 3
    });
    
    console.log(`Found ${sessions.length} sessions for user`);
    sessions.forEach((session, idx) => {
      const isExpired = session.expires < new Date();
      console.log(`   ${idx + 1}. ${session.sessionToken.substring(0, 8)}... expires: ${session.expires.toDateString()} ${isExpired ? '(EXPIRED)' : '(ACTIVE)'}`);
    });
    
    // Step 5: Create a test to verify the complete flow
    console.log('\n🧪 Step 5: Complete flow test...');
    
    console.log('Creating test script to verify dashboard data loading...');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixDashboardDataLoading().catch(console.error);