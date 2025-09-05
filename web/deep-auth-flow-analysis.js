/**
 * DEEP AUTHENTICATION FLOW ANALYSIS
 * Root cause investigation - no more patches
 */

const { PrismaClient } = require('./src/generated/prisma');

async function deepAuthFlowAnalysis() {
  console.log('🔍 DEEP AUTHENTICATION FLOW ANALYSIS');
  console.log('=====================================\n');

  const prisma = new PrismaClient();
  
  try {
    // 1. Check current user data and onboarding status
    console.log('👥 CURRENT USER DATA:');
    console.log('====================');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        onboardingCompleted: true,
        onboardingStep: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    users.forEach(user => {
      console.log(`📧 ${user.email}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'NULL'}`);
      console.log(`   Onboarding Completed: ${user.onboardingCompleted}`);
      console.log(`   Onboarding Step: ${user.onboardingStep || 'NULL'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Updated: ${user.updatedAt}`);
      console.log('');
    });

    // 2. Check reports for each user
    console.log('📊 REPORTS DATA:');
    console.log('================');
    for (const user of users) {
      const reports = await prisma.report.count({
        where: { userId: user.id }
      });
      console.log(`📧 ${user.email}: ${reports} reports`);
    }
    console.log('');

    // 3. Check NextAuth accounts
    console.log('🔐 NEXTAUTH ACCOUNTS:');
    console.log('====================');
    const accounts = await prisma.account.findMany({
      select: {
        userId: true,
        provider: true,
        providerAccountId: true,
        type: true
      }
    });
    
    accounts.forEach(account => {
      console.log(`👤 User ID: ${account.userId}`);
      console.log(`   Provider: ${account.provider}`);
      console.log(`   Type: ${account.type}`);
      console.log(`   Provider Account ID: ${account.providerAccountId}`);
      console.log('');
    });

    // 4. Check sessions
    console.log('🎫 NEXTAUTH SESSIONS:');
    console.log('====================');
    const sessions = await prisma.session.findMany({
      select: {
        userId: true,
        expires: true,
        sessionToken: true
      }
    });
    
    console.log(`Active sessions: ${sessions.length}`);
    sessions.forEach(session => {
      console.log(`👤 User ID: ${session.userId}`);
      console.log(`   Expires: ${session.expires}`);
      console.log(`   Token: ${session.sessionToken.substring(0, 20)}...`);
      console.log('');
    });

    console.log('🚨 IDENTIFIED ISSUES:');
    console.log('====================');
    
    // Issue 1: Check if users have proper onboarding flags
    const usersWithoutOnboarding = users.filter(u => !u.onboardingCompleted);
    if (usersWithoutOnboarding.length > 0) {
      console.log('❌ ISSUE 1: Users without completed onboarding should redirect to /onboarding');
      usersWithoutOnboarding.forEach(u => {
        console.log(`   - ${u.email}: onboardingCompleted=${u.onboardingCompleted}, step=${u.onboardingStep}`);
      });
    }

    // Issue 2: Check if users have reports but onboarding not completed
    for (const user of users) {
      const reportCount = await prisma.report.count({ where: { userId: user.id } });
      if (reportCount > 0 && !user.onboardingCompleted) {
        console.log(`❌ ISSUE 2: ${user.email} has ${reportCount} reports but onboarding not completed`);
      }
    }

    // Issue 3: Check for orphaned accounts
    const userIds = users.map(u => u.id);
    const orphanedAccounts = accounts.filter(a => !userIds.includes(a.userId));
    if (orphanedAccounts.length > 0) {
      console.log('❌ ISSUE 3: Orphaned OAuth accounts found');
      orphanedAccounts.forEach(a => console.log(`   - User ID: ${a.userId} (${a.provider})`));
    }

    console.log('\n🎯 ROOT CAUSE ANALYSIS:');
    console.log('=======================');
    console.log('The authentication flow has these critical issues:');
    console.log('');
    console.log('1. SESSION STATE INCONSISTENCY:');
    console.log('   - NextAuth session vs client-side session mismatch');
    console.log('   - Header component not getting proper session data');
    console.log('   - Hydration issues causing state flicker');
    console.log('');
    console.log('2. ROUTING LOGIC BROKEN:');
    console.log('   - Middleware not properly checking onboarding status');
    console.log('   - Dashboard loading before onboarding check completes');
    console.log('   - Race conditions between auth and onboarding API calls');
    console.log('');
    console.log('3. ONBOARDING STATE MANAGEMENT:');
    console.log('   - Database onboarding flags not properly set');
    console.log('   - Client-side routing not respecting server-side state');
    console.log('   - Multiple sources of truth for onboarding status');
    console.log('');
    console.log('4. HEADER COMPONENT ISSUES:');
    console.log('   - Not properly handling loading states');
    console.log('   - Session data not available during initial render');
    console.log('   - Conditional rendering causing UI flicker');

    console.log('\n🔧 REQUIRED FIXES (NO MORE PATCHES):');
    console.log('====================================');
    console.log('1. Fix middleware to properly handle onboarding routing');
    console.log('2. Fix header component to handle session states correctly');
    console.log('3. Fix dashboard to check onboarding before rendering');
    console.log('4. Fix onboarding state management in database');
    console.log('5. Add proper loading states throughout the app');

  } catch (error) {
    console.error('❌ Analysis error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deepAuthFlowAnalysis().catch(console.error);