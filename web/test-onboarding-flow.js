/**
 * Test Onboarding Flow - Reset user for testing
 */

const { PrismaClient } = require('./src/generated/prisma');

async function testOnboardingFlow() {
  console.log('🧪 TESTING ONBOARDING FLOW');
  console.log('===========================\n');

  const prisma = new PrismaClient();
  
  try {
    // Get current users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        onboardingCompleted: true,
        profileCompleted: true,
        firstReportUploaded: true,
        onboardingStep: true
      }
    });
    
    console.log('👥 CURRENT USERS:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
      console.log(`      Onboarding completed: ${user.onboardingCompleted}`);
      console.log(`      Profile completed: ${user.profileCompleted}`);
      console.log(`      First report uploaded: ${user.firstReportUploaded}`);
      console.log(`      Current step: ${user.onboardingStep || 'None'}`);
    });
    
    // Ask which user to reset for testing
    console.log('\n🔄 RESETTING ONBOARDING STATUS FOR TESTING:');
    
    // Reset all users to need onboarding (for testing purposes)
    const resetResult = await prisma.user.updateMany({
      data: {
        onboardingCompleted: false,
        profileCompleted: false,
        firstReportUploaded: false,
        secondReportUploaded: false,
        onboardingStep: 'profile',
        onboardingCompletedAt: null
      }
    });
    
    console.log(`   ✅ Reset ${resetResult.count} users to need onboarding`);
    
    // Verify the reset
    console.log('\n📊 VERIFICATION - USERS AFTER RESET:');
    const updatedUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        onboardingCompleted: true,
        profileCompleted: true,
        firstReportUploaded: true,
        onboardingStep: true
      }
    });
    
    updatedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
      console.log(`      Onboarding completed: ${user.onboardingCompleted}`);
      console.log(`      Profile completed: ${user.profileCompleted}`);
      console.log(`      First report uploaded: ${user.firstReportUploaded}`);
      console.log(`      Current step: ${user.onboardingStep || 'None'}`);
    });
    
    console.log('\n🎯 TESTING INSTRUCTIONS:');
    console.log('========================');
    console.log('1. 🌐 Open your browser and go to http://localhost:8080');
    console.log('2. 🔑 Sign in with one of the user accounts');
    console.log('3. ✅ You should now be redirected to the onboarding flow');
    console.log('4. 📝 Complete the profile setup step');
    console.log('5. 📄 Upload a test report');
    console.log('6. 🎉 Complete the onboarding process');
    console.log('7. 📊 Verify you land on the dashboard');
    
    console.log('\n🔄 TO RESET AGAIN:');
    console.log('   Run: node test-onboarding-flow.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testOnboardingFlow().catch(console.error);