/**
 * Test Authentication Fix
 * Verify that the session storage and onboarding fixes work
 */

const { PrismaClient } = require('./src/generated/prisma');

async function testAuthenticationFix() {
  console.log('🧪 TESTING AUTHENTICATION FIX');
  console.log('==============================\n');

  const prisma = new PrismaClient();
  
  try {
    // 1. Check user onboarding state
    console.log('👥 USER ONBOARDING STATE:');
    const users = await prisma.user.findMany({
      select: {
        email: true,
        onboardingStep: true,
        onboardingCompleted: true,
        profileCompleted: true,
        firstReportUploaded: true
      }
    });
    
    users.forEach(user => {
      console.log(`   ${user.email}:`);
      console.log(`     Step: ${user.onboardingStep}`);
      console.log(`     Completed: ${user.onboardingCompleted}`);
      console.log(`     Profile: ${user.profileCompleted}`);
      console.log(`     First report: ${user.firstReportUploaded}`);
    });
    
    // 2. Check NextAuth tables
    console.log('\n🔐 NEXTAUTH TABLES:');
    const accountCount = await prisma.account.count();
    const sessionCount = await prisma.session.count();
    
    console.log(`   Accounts: ${accountCount}`);
    console.log(`   Sessions: ${sessionCount}`);
    
    if (sessionCount > 0) {
      const sessions = await prisma.session.findMany({
        include: {
          user: { select: { email: true } }
        }
      });
      
      console.log('   Active sessions:');
      sessions.forEach(session => {
        const isExpired = new Date() > session.expires;
        console.log(`     - ${session.user.email}: ${isExpired ? 'EXPIRED' : 'ACTIVE'}`);
      });
    }
    
    // 3. Test onboarding logic
    console.log('\n🎯 ONBOARDING LOGIC TEST:');
    for (const user of users) {
      const needsOnboarding = !user.onboardingCompleted;
      const currentStep = user.onboardingStep;
      
      console.log(`   ${user.email}:`);
      console.log(`     Needs onboarding: ${needsOnboarding}`);
      console.log(`     Should redirect to: ${needsOnboarding ? '/onboarding' : '/dashboard'}`);
      console.log(`     Current step: ${currentStep}`);
    }
    
    console.log('\n✅ EXPECTED BEHAVIOR AFTER FIX:');
    console.log('================================');
    console.log('1. 🔑 Login → Session created in database');
    console.log('2. 📊 Header shows user email/name (not "Sign In")');
    console.log('3. 🎯 New users → Redirected to /onboarding');
    console.log('4. 📝 Onboarding → Profile setup step');
    console.log('5. 🎉 Complete onboarding → Dashboard access');
    
    console.log('\n🧪 TESTING STEPS:');
    console.log('=================');
    console.log('1. Restart your Next.js server (npm run dev)');
    console.log('2. Clear browser cookies/localStorage');
    console.log('3. Go to http://localhost:8080');
    console.log('4. Sign in with your email');
    console.log('5. Check header shows your email');
    console.log('6. Should redirect to onboarding flow');
    console.log('7. Complete onboarding steps');
    console.log('8. Verify dashboard access');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthenticationFix().catch(console.error);