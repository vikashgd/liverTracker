/**
 * Debug script to investigate onboarding report tracking issue
 * User has uploaded report but onboarding still shows "upload report" step
 */

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function debugOnboardingReportTracking() {
  try {
    console.log('🔍 Debugging Onboarding Report Tracking Issue...\n');

    // Get all users with their onboarding status and report counts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        onboardingCompleted: true,
        onboardingStep: true,
        profileCompleted: true,
        firstReportUploaded: true,
        secondReportUploaded: true,
        onboardingCompletedAt: true,
        _count: {
          select: {
            reportFiles: true,
          },
        },
        reportFiles: {
          select: {
            id: true,
            fileName: true,
            uploadedAt: true,
            processingStatus: true,
          },
          orderBy: {
            uploadedAt: 'desc',
          },
          take: 3, // Show last 3 reports
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Show last 10 users
    });

    console.log(`📊 Found ${users.length} recent users\n`);

    for (const user of users) {
      console.log(`👤 User: ${user.name || 'No name'} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   📋 Onboarding Status:`);
      console.log(`      - Completed: ${user.onboardingCompleted}`);
      console.log(`      - Current Step: ${user.onboardingStep || 'None'}`);
      console.log(`      - Profile Completed: ${user.profileCompleted}`);
      console.log(`      - First Report Uploaded: ${user.firstReportUploaded}`);
      console.log(`      - Second Report Uploaded: ${user.secondReportUploaded}`);
      console.log(`      - Completed At: ${user.onboardingCompletedAt || 'Not completed'}`);
      
      console.log(`   📄 Reports (${user._count.reportFiles} total):`);
      if (user.reportFiles.length === 0) {
        console.log(`      - No reports found`);
      } else {
        user.reportFiles.forEach((report, index) => {
          console.log(`      ${index + 1}. ${report.fileName}`);
          console.log(`         - ID: ${report.id}`);
          console.log(`         - Uploaded: ${report.uploadedAt}`);
          console.log(`         - Status: ${report.processingStatus}`);
        });
      }

      // Check for mismatch
      const hasReports = user._count.reportFiles > 0;
      const onboardingThinksSoToo = user.firstReportUploaded;
      
      if (hasReports && !onboardingThinksSoToo) {
        console.log(`   ⚠️  MISMATCH DETECTED:`);
        console.log(`      - User has ${user._count.reportFiles} reports in database`);
        console.log(`      - But firstReportUploaded = false`);
        console.log(`      - Current onboarding step: ${user.onboardingStep}`);
      } else if (hasReports && onboardingThinksSoToo) {
        console.log(`   ✅ Onboarding tracking looks correct`);
      } else if (!hasReports && !onboardingThinksSoToo) {
        console.log(`   ℹ️  No reports uploaded yet (expected)`);
      }

      console.log(''); // Empty line for readability
    }

    // Check for users with reports but incorrect onboarding flags
    console.log('\n🔍 Looking for users with report tracking issues...\n');

    const usersWithMismatch = await prisma.user.findMany({
      where: {
        AND: [
          {
            reportFiles: {
              some: {}, // Has at least one report
            },
          },
          {
            firstReportUploaded: false, // But onboarding thinks they don't
          },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        onboardingStep: true,
        firstReportUploaded: true,
        _count: {
          select: {
            reportFiles: true,
          },
        },
      },
    });

    if (usersWithMismatch.length > 0) {
      console.log(`🚨 Found ${usersWithMismatch.length} users with report tracking issues:`);
      
      for (const user of usersWithMismatch) {
        console.log(`   - ${user.name || 'No name'} (${user.email})`);
        console.log(`     Has ${user._count.reportFiles} reports but firstReportUploaded = false`);
        console.log(`     Current step: ${user.onboardingStep}`);
      }

      console.log('\n💡 These users need their onboarding flags updated.');
    } else {
      console.log('✅ No users found with report tracking mismatches.');
    }

    // Check the reports API integration
    console.log('\n🔍 Checking recent report uploads for onboarding integration...\n');

    const recentReports = await prisma.reportFile.findMany({
      select: {
        id: true,
        fileName: true,
        uploadedAt: true,
        processingStatus: true,
        userId: true,
        user: {
          select: {
            email: true,
            firstReportUploaded: true,
            onboardingStep: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
      take: 10,
    });

    console.log(`📄 Last ${recentReports.length} report uploads:`);
    
    for (const report of recentReports) {
      console.log(`   - ${report.fileName} (${report.uploadedAt})`);
      console.log(`     User: ${report.user.email}`);
      console.log(`     Processing: ${report.processingStatus}`);
      console.log(`     User's firstReportUploaded: ${report.user.firstReportUploaded}`);
      console.log(`     User's onboarding step: ${report.user.onboardingStep}`);
      
      if (report.processingStatus === 'completed' && !report.user.firstReportUploaded) {
        console.log(`     ⚠️  This completed report should have triggered onboarding update!`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error debugging onboarding report tracking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugOnboardingReportTracking();