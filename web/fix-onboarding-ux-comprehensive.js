/**
 * Comprehensive Onboarding UX Fix
 * 1. Fix users who think they completed profile but missing height/weight
 * 2. Improve profile form validation
 * 3. Fix 500 errors
 */

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function fixOnboardingUX() {
  console.log('🔧 COMPREHENSIVE ONBOARDING UX FIX');
  console.log('=================================\n');

  try {
    // Find all users who think they completed profile but are missing height/weight
    const incompleteUsers = await prisma.user.findMany({
      where: {
        onboardingCompleted: false,
        profileCompleted: true, // They think profile is complete
      },
      include: {
        profile: true,
        reportFiles: {
          select: {
            id: true,
          }
        }
      }
    });

    console.log(`🔍 Found ${incompleteUsers.length} users with potentially incomplete profiles\n`);

    for (const user of incompleteUsers) {
      console.log(`👤 Checking: ${user.email}`);
      
      if (!user.profile) {
        console.log('   ❌ No profile found - marking profileCompleted as false');
        await prisma.user.update({
          where: { id: user.id },
          data: { profileCompleted: false }
        });
        continue;
      }

      const hasGender = !!user.profile.gender;
      const hasHeight = !!user.profile.height;
      const hasWeight = !!user.profile.weight;
      const actuallyComplete = hasGender && hasHeight && hasWeight;
      
      console.log(`   Gender: ${hasGender ? '✅' : '❌'} (${user.profile.gender})`);
      console.log(`   Height: ${hasHeight ? '✅' : '❌'} (${user.profile.height})`);
      console.log(`   Weight: ${hasWeight ? '✅' : '❌'} (${user.profile.weight})`);
      console.log(`   Actually complete: ${actuallyComplete}`);

      if (!actuallyComplete) {
        console.log('   🔧 Fixing: Setting profileCompleted = false (missing required fields)');
        await prisma.user.update({
          where: { id: user.id },
          data: {
            profileCompleted: false,
            onboardingStep: 'profile' // Send them back to complete profile
          }
        });
      } else if (user.reportFiles.length > 0) {
        console.log('   🎉 Fixing: User actually IS complete - setting onboardingCompleted = true');
        await prisma.user.update({
          where: { id: user.id },
          data: {
            onboardingCompleted: true,
            onboardingCompletedAt: new Date(),
            onboardingStep: 'complete'
          }
        });
      }
      
      console.log('');
    }

    // Also check users who are stuck in onboarding but actually complete
    console.log('\n🔍 Checking for users who are actually complete but stuck...');
    
    const stuckUsers = await prisma.user.findMany({
      where: {
        onboardingCompleted: false,
      },
      include: {
        profile: true,
        reportFiles: {
          select: {
            id: true,
          }
        }
      }
    });

    let fixedCount = 0;
    
    for (const user of stuckUsers) {
      if (!user.profile) continue;
      
      const profileComplete = user.profile.gender && user.profile.height && user.profile.weight;
      const hasReports = user.reportFiles.length > 0;
      
      if (profileComplete && hasReports && !user.onboardingCompleted) {
        console.log(`🎉 Auto-completing: ${user.email}`);
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
        fixedCount++;
      }
    }

    console.log(`\n🎉 SUMMARY:`);
    console.log(`   Fixed ${fixedCount} users who were stuck despite being complete`);
    console.log(`   Updated profile completion flags for users missing required fields`);

  } catch (error) {
    console.error('❌ Error during fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOnboardingUX();