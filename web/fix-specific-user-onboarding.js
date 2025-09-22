/**
 * Fix onboarding for specific user: fujikam.india@gmail.com
 * This will update the onboarding flags based on actual report count
 */

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function fixSpecificUserOnboarding() {
  try {
    console.log('🔧 Fixing Onboarding for fujikam.india@gmail.com...\n');

    // Find the specific user
    const user = await prisma.user.findUnique({
      where: {
        email: 'fujikam.india@gmail.com'
      },
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
        reportFiles: {
          select: {
            id: true,
            objectKey: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
    });

    if (!user) {
      console.log('❌ User fujikam.india@gmail.com not found');
      return;
    }

    console.log(`👤 Found user: ${user.name || 'No name'} (${user.email})`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Report count: ${user._count.reportFiles}`);
    console.log(`   Current onboarding state:`);
    console.log(`      - Completed: ${user.onboardingCompleted}`);
    console.log(`      - Step: ${user.onboardingStep}`);
    console.log(`      - Profile completed: ${user.profileCompleted}`);
    console.log(`      - First report uploaded: ${user.firstReportUploaded}`);
    console.log(`      - Second report uploaded: ${user.secondReportUploaded}`);

    if (user.reportFiles.length > 0) {
      console.log(`   Reports:`);
      user.reportFiles.forEach((report, index) => {
        console.log(`      ${index + 1}. ${report.objectKey} (${report.createdAt})`);
      });
    }

    // Determine correct flags based on report count
    const reportCount = user._count.reportFiles;
    const shouldHaveFirst = reportCount >= 1;
    const shouldHaveSecond = reportCount >= 2;
    
    // Determine correct onboarding step
    let correctStep = 'profile';
    if (user.profileCompleted && reportCount >= 1) {
      correctStep = 'data-review';
    } else if (user.profileCompleted) {
      correctStep = 'first-upload';
    }

    console.log(`\n🎯 Correct state should be:`);
    console.log(`   - First report uploaded: ${shouldHaveFirst}`);
    console.log(`   - Second report uploaded: ${shouldHaveSecond}`);
    console.log(`   - Onboarding step: ${correctStep}`);

    // Check if update is needed
    const needsUpdate = 
      user.firstReportUploaded !== shouldHaveFirst ||
      user.secondReportUploaded !== shouldHaveSecond ||
      user.onboardingStep !== correctStep;

    if (needsUpdate) {
      console.log(`\n🔧 Updating user onboarding state...`);
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstReportUploaded: shouldHaveFirst,
          secondReportUploaded: shouldHaveSecond,
          onboardingStep: correctStep,
        },
      });

      console.log(`✅ Successfully updated onboarding state!`);
      
      // Verify the update
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          onboardingStep: true,
          firstReportUploaded: true,
          secondReportUploaded: true,
        },
      });

      console.log(`\n✅ Verified updated state:`);
      console.log(`   - First report uploaded: ${updatedUser.firstReportUploaded}`);
      console.log(`   - Second report uploaded: ${updatedUser.secondReportUploaded}`);
      console.log(`   - Onboarding step: ${updatedUser.onboardingStep}`);

      console.log(`\n🎉 Fix complete! User should now see correct onboarding progress.`);
      console.log(`   Please refresh the page and check your onboarding status.`);
      
    } else {
      console.log(`\n✅ User onboarding state is already correct - no update needed.`);
    }

  } catch (error) {
    console.error('❌ Error fixing user onboarding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixSpecificUserOnboarding();