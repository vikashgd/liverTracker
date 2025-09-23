/**
 * Comprehensive Onboarding Flow Debug Script
 * Diagnoses why users are stuck in onboarding loop
 */

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function debugOnboardingFlow() {
  console.log('🔍 COMPREHENSIVE ONBOARDING FLOW DIAGNOSIS');
  console.log('==========================================\n');

  try {
    // Get all users and their onboarding status
    const users = await prisma.user.findMany({
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

    console.log(`📊 Found ${users.length} users in database\n`);

    for (const user of users) {
      console.log(`👤 USER: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Onboarding Complete: ${user.onboardingCompleted}`);
      
      // Check profile
      if (user.profile) {
        console.log(`   ✅ Profile exists:`);
        console.log(`      - Age: ${user.profile.age}`);
        console.log(`      - Gender: ${user.profile.gender}`);
        console.log(`      - Height: ${user.profile.height}`);
        console.log(`      - Weight: ${user.profile.weight}`);
        
        const profileComplete = user.profile.age && user.profile.gender && 
                               user.profile.height && user.profile.weight;
        console.log(`      - Complete: ${profileComplete}`);
      } else {
        console.log(`   ❌ No profile found`);
      }

      // Check reports
      console.log(`   📄 Reports: ${user.reportFiles.length}`);
      if (user.reportFiles.length > 0) {
        console.log(`      - First report: ${user.reportFiles[0].createdAt}`);
        console.log(`      - Latest report: ${user.reportFiles[user.reportFiles.length - 1].createdAt}`);
        user.reportFiles.forEach((report, index) => {
          console.log(`      - Report ${index + 1}: ${report.id} (${report.reportType})`);
        });
      }

      // Determine what onboarding status SHOULD be
      const hasProfile = user.profile && user.profile.gender && 
                        user.profile.height && user.profile.weight;
      const hasReports = user.reportFiles.length > 0;
      const shouldBeComplete = hasProfile && hasReports;

      console.log(`   🎯 SHOULD onboarding be complete? ${shouldBeComplete}`);
      console.log(`   🔄 ACTUAL onboarding complete: ${user.onboardingCompleted}`);
      
      if (shouldBeComplete !== user.onboardingCompleted) {
        console.log(`   ⚠️  MISMATCH DETECTED! Needs fixing.`);
      }

      console.log('   ' + '─'.repeat(50));
    }

    // Test the onboarding API logic
    console.log('\n🧪 TESTING ONBOARDING API LOGIC');
    console.log('================================\n');

    for (const user of users) {
      console.log(`Testing user: ${user.email}`);
      
      // Simulate the onboarding API call
      const profile = user.profile;
      const reportCount = user.reportFiles.length;
      
      const profileComplete = profile && profile.gender && 
                             profile.height && profile.weight;
      const hasReports = reportCount > 0;
      const needsOnboarding = !profileComplete || !hasReports;
      
      console.log(`  - Profile complete: ${profileComplete}`);
      console.log(`  - Has reports: ${hasReports}`);
      console.log(`  - Needs onboarding: ${needsOnboarding}`);
      console.log(`  - Current step: ${!profileComplete ? 'profile' : !hasReports ? 'first-upload' : 'complete'}`);
      
      if (!needsOnboarding && !user.onboardingCompleted) {
        console.log(`  ⚠️  User should NOT need onboarding but onboardingComplete is false!`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugOnboardingFlow();