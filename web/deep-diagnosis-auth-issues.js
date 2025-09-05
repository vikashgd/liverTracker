/**
 * Deep Diagnosis of Authentication Issues
 * Systematic analysis of the authentication flow
 */

const { PrismaClient } = require('./src/generated/prisma');

async function deepDiagnosis() {
  console.log('🔍 DEEP DIAGNOSIS: AUTHENTICATION FLOW ISSUES');
  console.log('==============================================\n');

  const prisma = new PrismaClient();
  
  try {
    // 1. Check current user states in database
    console.log('📊 DATABASE USER ANALYSIS:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        onboardingCompleted: true,
        profileCompleted: true,
        firstReportUploaded: true,
        onboardingStep: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Name: ${user.name || 'NULL'}`);
      console.log(`      Onboarding completed: ${user.onboardingCompleted}`);
      console.log(`      Profile completed: ${user.profileCompleted}`);
      console.log(`      First report uploaded: ${user.firstReportUploaded}`);
      console.log(`      Current step: ${user.onboardingStep || 'NULL'}`);
      console.log(`      Created: ${user.createdAt}`);
      console.log(`      Updated: ${user.updatedAt}`);
      console.log('');
    });

    // 2. Check NextAuth configuration
    console.log('🔧 NEXTAUTH CONFIGURATION ANALYSIS:');
    console.log(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
    console.log(`   NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET'}`);
    console.log(`   GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'}`);
    console.log(`   GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET'}`);
    
    // 3. Check database connection
    console.log('\n💾 DATABASE CONNECTION TEST:');
    const dbTest = await prisma.$queryRaw`SELECT current_database() as db_name, current_user as user_name`;
    console.log(`   Connected to: ${dbTest[0].db_name}`);
    console.log(`   As user: ${dbTest[0].user_name}`);
    
    // 4. Check NextAuth tables
    console.log('\n🔐 NEXTAUTH TABLES ANALYSIS:');
    try {
      const accounts = await prisma.account.count();
      const sessions = await prisma.session.count();
      console.log(`   Accounts: ${accounts}`);
      console.log(`   Sessions: ${sessions}`);
      
      if (sessions > 0) {
        const activeSessions = await prisma.session.findMany({
          include: {
            user: {
              select: { email: true }
            }
          },
          orderBy: { expires: 'desc' },
          take: 5
        });
        
        console.log('   Recent sessions:');
        activeSessions.forEach(session => {
          const isExpired = new Date() > session.expires;
          console.log(`     - ${session.user.email}: ${isExpired ? 'EXPIRED' : 'ACTIVE'} (expires: ${session.expires})`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error checking NextAuth tables: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Diagnosis error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n🎯 ROOT CAUSE ANALYSIS:');
  console.log('======================');
  console.log('Based on the symptoms you described:');
  console.log('1. Header still shows "Sign In" after login');
  console.log('2. User goes to dashboard instead of onboarding');
  console.log('3. Authentication state not syncing properly');
  console.log('');
  console.log('POSSIBLE ROOT CAUSES:');
  console.log('A. NextAuth session not being created/stored properly');
  console.log('B. useSession hook not working correctly');
  console.log('C. Component rendering issues (SSR/CSR mismatch)');
  console.log('D. Authentication configuration problems');
  console.log('E. Database session storage issues');
  console.log('');
  console.log('NEXT STEPS FOR DIAGNOSIS:');
  console.log('1. Check browser dev tools for session cookies');
  console.log('2. Check network requests during login');
  console.log('3. Check NextAuth debug logs');
  console.log('4. Verify component rendering order');
}

deepDiagnosis().catch(console.error);