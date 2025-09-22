/**
 * Fix onboarding report tracking for existing users
 * Updates firstReportUploaded and secondReportUploaded flags based on actual report counts
 */

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function fixOnboardingReportTracking() {
  try {
    console.log('🔧 Fixing Onboarding Report Tracking for All Users...\n');

    // Find all users with reports but incorrect onboarding flags
    const usersWithReports = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        onboardingCompleted: true,
        onboardingStep: true,
        profileCompleted: true,
        firstReportUploaded: true,
        secondReportUploaded: true,
        _count: {
          select: {
            reportFiles: true,
          },
        },
      },
      where: {
        reportFiles: {
          some: {}, // Has at least one report
        },
      },
    });

    console.log(`📊 Found ${usersWithReports.length} users with reports\n`);

    let fixedUsers = 0;
    let alreadyCorrect = 0;

    for (const user of usersWithReports) {
      const reportCount = user._count.reportFiles;
      const shouldHaveFirst = reportCount >= 1;
      const shouldHaveSecond = reportCount >= 2;
      
      console.log(`👤 ${user.name || 'No name'} (${user.email})`);
      console.log(`   Reports: ${reportCount}`);
      console.log(`   Current flags: first=${user.firstReportUploaded}, second=${user.secondReportUploaded}`);
      console.log(`   Should be: first=${shouldHaveFirst}, second=${shouldHaveSecond}`);

      // Check if flags need updating
      const needsFirstUpdate = shouldHaveFirst && !user.firstReportUploaded;
      const needsSecondUpdate = shouldHaveSecond && !user.secondReportUploaded;
      const needsFirstRemoval = !shouldHaveFirst && user.firstReportUploaded;
      const needsSecondRemoval = !shouldHaveSecond && user.secondReportUploaded;

      if (needsFirstUpdate || needsSecondUpdate || needsFirstRemoval || needsSecondRemoval) {
        console.log(`   🔧 Updating flags...`);
        
        // Determine the correct onboarding step
        let newOnboardingStep = user.onboardingStep;
        if (reportCount >= 1 && user.profileCompleted) {
          newOnboardingStep = 'data-review';
        } else if (user.profileCompleted) {
          newOnboardingStep = 'first-upload';
        } else {
          newOnboardingStep = 'profile';
        }

        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              firstReportUploaded: shouldHaveFirst,
              secondReportUploaded: shouldHaveSecond,
              onboardingStep: newOnboardingStep,
            },
          });

          console.log(`   ✅ Fixed! New step: ${newOnboardingStep}`);
          fixedUsers++;
        } catch (error) {
          console.error(`   ❌ Error updating user ${user.id}:`, error);
        }
      } else {
        console.log(`   ✅ Already correct`);
        alreadyCorrect++;
      }

      console.log(''); // Empty line for readability
    }

    // Also check users with no reports but incorrect flags
    console.log('\n🔍 Checking users with no reports but incorrect flags...\n');

    const usersWithoutReports = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        firstReportUploaded: true,
        secondReportUploaded: true,
        _count: {
          select: {
            reportFiles: true,
          },
        },
      },
      where: {
        AND: [
          {
            reportFiles: {
              none: {}, // Has no reports
            },
          },
          {
            OR: [
              { firstReportUploaded: true },
              { secondReportUploaded: true },
            ],
          },
        ],
      },
    });

    console.log(`📊 Found ${usersWithoutReports.length} users with no reports but incorrect flags\n`);

    for (const user of usersWithoutReports) {
      console.log(`👤 ${user.name || 'No name'} (${user.email})`);
      console.log(`   Reports: 0`);
      console.log(`   Current flags: first=${user.firstReportUploaded}, second=${user.secondReportUploaded}`);
      console.log(`   🔧 Resetting flags to false...`);

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            firstReportUploaded: false,
            secondReportUploaded: false,
            onboardingStep: 'profile', // Reset to profile step
          },
        });

        console.log(`   ✅ Reset flags to false`);
        fixedUsers++;
      } catch (error) {
        console.error(`   ❌ Error updating user ${user.id}:`, error);
      }

      console.log(''); // Empty line for readability
    }

    console.log('\n📈 Summary:');
    console.log(`   ✅ Fixed users: ${fixedUsers}`);
    console.log(`   ✅ Already correct: ${alreadyCorrect}`);
    console.log(`   📊 Total users with reports: ${usersWithReports.length}`);
    console.log(`   📊 Users with no reports but wrong flags: ${usersWithoutReports.length}`);

    if (fixedUsers > 0) {
      console.log('\n🎉 Onboarding report tracking has been fixed for all users!');
      console.log('   Users should now see correct onboarding progress.');
    } else {
      console.log('\n✅ All users already had correct onboarding flags.');
    }

  } catch (error) {
    console.error('❌ Error fixing onboarding report tracking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixOnboardingReportTracking();