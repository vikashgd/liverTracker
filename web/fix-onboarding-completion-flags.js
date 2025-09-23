/**
 * Fix Onboarding Completion Flags
 * Updates users who should have completed onboarding but flag is still false
 */

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function fixOnboardingFlags() {
  console.log('🔧 FIXING ONBOARDING COMPLETION FLAGS');
  console.log('====================================\n');

  try {
    // Get all users with their profiles and reports
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

    console.log(`📊 Found ${users.length} users to check\n`);

    let fixedCount = 0;

    for (const user of users) {
      const profile = user.profile;
      const reportCount = user.reportFiles.length;
      
      // Check if profile is complete (gender, height, weight required)
      const profileComplete = profile && profile.gender && 
                             profile.height && profile.weight;
      const hasReports = reportCount > 0;
      const shouldBeComplete = profileComplete && hasReports;

      console.log(`👤 ${user.email}`);
      console.log(`   Profile complete: ${profileComplete}`);
      console.log(`   Has reports: ${hasReports} (${reportCount})`);
      console.log(`   Should be complete: ${shouldBeComplete}`);
      console.log(`   Currently complete: ${user.onboardingCompleted}`);

      if (shouldBeComplete && !user.onboardingCompleted) {
        console.log(`   🔧 FIXING: Setting onboardingCompleted = true`);
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            onboardingCompleted: true,
            onboardingCompletedAt: new Date(),
            onboardingStep: 'complete',
            profileCompleted: true,
            firstReportUploaded: true,
            secondReportUploaded: reportCount >= 2
          }
        });
        
        fixedCount++;
        console.log(`   ✅ Fixed!`);
      } else if (shouldBeComplete && user.onboardingCompleted) {
        console.log(`   ✅ Already correct`);
      } else {
        console.log(`   ⏳ Still needs onboarding`);
      }
      
      console.log('');
    }

    console.log(`🎉 SUMMARY:`);
    console.log(`   Fixed ${fixedCount} users`);
    console.log(`   Total users: ${users.length}`);

  } catch (error) {
    console.error('❌ Error during fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOnboardingFlags();