/**
 * Diagnose Onboarding Completion Logic
 * Find out exactly why users with profile + reports are still stuck in onboarding
 */

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function diagnoseOnboardingLogic() {
  console.log('🔍 DIAGNOSING ONBOARDING COMPLETION LOGIC');
  console.log('=========================================\n');

  try {
    // Check the specific user from the logs
    const userEmail = 'amzfan09@gmail.com';
    
    console.log(`🎯 Checking user: ${userEmail}`);
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        profile: true,
        reportFiles: {
          select: {
            id: true,
            createdAt: true,
            reportType: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('\n📊 USER DATA:');
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.createdAt}`);
    
    console.log('\n🏁 ONBOARDING FLAGS:');
    console.log(`   onboardingCompleted: ${user.onboardingCompleted}`);
    console.log(`   onboardingStep: ${user.onboardingStep}`);
    console.log(`   profileCompleted: ${user.profileCompleted}`);
    console.log(`   firstReportUploaded: ${user.firstReportUploaded}`);
    console.log(`   secondReportUploaded: ${user.secondReportUploaded}`);
    console.log(`   onboardingCompletedAt: ${user.onboardingCompletedAt}`);

    console.log('\n👤 PROFILE DATA:');
    if (user.profile) {
      console.log(`   ✅ Profile exists`);
      console.log(`   Gender: ${user.profile.gender}`);
      console.log(`   Height: ${user.profile.height}`);
      console.log(`   Weight: ${user.profile.weight}`);
      console.log(`   DOB: ${user.profile.dateOfBirth}`);
      
      const profileComplete = user.profile.gender && user.profile.height && user.profile.weight;
      console.log(`   🎯 Profile Complete: ${profileComplete}`);
    } else {
      console.log(`   ❌ No profile found`);
    }

    console.log('\n📄 REPORT DATA:');
    console.log(`   Report count: ${user.reportFiles.length}`);
    if (user.reportFiles.length > 0) {
      user.reportFiles.forEach((report, index) => {
        console.log(`   Report ${index + 1}: ${report.id} (${report.reportType}) - ${report.createdAt}`);
      });
    }

    console.log('\n🧮 ONBOARDING LOGIC ANALYSIS:');
    
    // Check what the onboarding logic SHOULD return
    const hasProfile = !!user.profile;
    const profileComplete = hasProfile && user.profile.gender && user.profile.height && user.profile.weight;
    const hasReports = user.reportFiles.length > 0;
    const shouldBeComplete = profileComplete && hasReports;
    
    console.log(`   Has profile: ${hasProfile}`);
    console.log(`   Profile complete: ${profileComplete}`);
    console.log(`   Has reports: ${hasReports}`);
    console.log(`   🎯 SHOULD be complete: ${shouldBeComplete}`);
    console.log(`   🔄 ACTUALLY complete: ${user.onboardingCompleted}`);
    
    if (shouldBeComplete && !user.onboardingCompleted) {
      console.log('\n🚨 PROBLEM IDENTIFIED:');
      console.log('   User meets all requirements but onboardingCompleted = false');
      console.log('   This is why they are stuck in onboarding loop!');
      
      console.log('\n🔧 FIXING NOW...');
      await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          onboardingStep: 'complete',
          profileCompleted: true,
          firstReportUploaded: true,
          secondReportUploaded: user.reportFiles.length >= 2
        }
      });
      console.log('✅ Fixed onboarding flags for user!');
    } else if (shouldBeComplete && user.onboardingCompleted) {
      console.log('\n✅ User onboarding status is correct');
    } else {
      console.log('\n⏳ User still needs to complete onboarding requirements');
    }

    // Test the onboarding API logic
    console.log('\n🧪 TESTING ONBOARDING API LOGIC:');
    
    // Simulate what getUserOnboardingState would return
    const needsOnboarding = !user.onboardingCompleted;
    let currentStep = null;
    const completedSteps = [];

    if (needsOnboarding) {
      if (!user.profileCompleted) {
        currentStep = 'profile';
      } else if (!user.firstReportUploaded) {
        currentStep = 'first-upload';
        completedSteps.push('profile');
      } else if (user.reportFiles.length === 1) {
        currentStep = 'data-review';
        completedSteps.push('profile', 'first-upload');
      } else {
        currentStep = 'complete';
        completedSteps.push('profile', 'first-upload', 'data-review');
      }
    }

    console.log(`   needsOnboarding: ${needsOnboarding}`);
    console.log(`   currentStep: ${currentStep}`);
    console.log(`   completedSteps: ${JSON.stringify(completedSteps)}`);

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseOnboardingLogic();