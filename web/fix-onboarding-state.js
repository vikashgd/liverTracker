/**
 * Fix Onboarding State for Existing Users
 */

const { PrismaClient } = require('./src/generated/prisma');

async function fixOnboardingState() {
  console.log('🔧 FIXING ONBOARDING STATE');
  console.log('===========================\n');

  const prisma = new PrismaClient();
  
  try {
    // Get users with null onboarding step
    const usersToFix = await prisma.user.findMany({
      where: {
        OR: [
          { onboardingStep: null },
          { onboardingStep: '' }
        ]
      },
      select: {
        id: true,
        email: true,
        onboardingCompleted: true,
        onboardingStep: true
      }
    });
    
    console.log(`📊 Found ${usersToFix.length} users with missing onboarding step:`);
    usersToFix.forEach(user => {
      console.log(`   - ${user.email}: step=${user.onboardingStep}, completed=${user.onboardingCompleted}`);
    });
    
    if (usersToFix.length === 0) {
      console.log('✅ All users have proper onboarding state');
      return;
    }
    
    // Fix onboarding state
    console.log('\n🔄 Fixing onboarding state...');
    
    const updateResult = await prisma.user.updateMany({
      where: {
        OR: [
          { onboardingStep: null },
          { onboardingStep: '' }
        ]
      },
      data: {
        onboardingStep: 'profile', // Set to first step
        onboardingCompleted: false,
        profileCompleted: false,
        firstReportUploaded: false,
        secondReportUploaded: false
      }
    });
    
    console.log(`✅ Updated ${updateResult.count} users`);
    
    // Verify the fix
    console.log('\n📊 VERIFICATION:');
    const verifyUsers = await prisma.user.findMany({
      select: {
        email: true,
        onboardingStep: true,
        onboardingCompleted: true
      }
    });
    
    verifyUsers.forEach(user => {
      console.log(`   - ${user.email}: step=${user.onboardingStep}, completed=${user.onboardingCompleted}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixOnboardingState().catch(console.error);