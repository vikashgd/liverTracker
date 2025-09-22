/**
 * Test script to verify onboarding report integration is working
 * Simulates the report upload process and checks onboarding updates
 */

const { PrismaClient } = require('./src/generated/prisma');
const { 
  markFirstReportUploaded, 
  markSecondReportUploaded,
  getUserOnboardingState 
} = require('./src/lib/onboarding-utils');

const prisma = new PrismaClient();

async function testOnboardingReportIntegration() {
  try {
    console.log('🧪 Testing Onboarding Report Integration...\n');

    // Find a user with reports to test with
    const testUser = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        name: true,
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

    if (!testUser) {
      console.log('❌ No users with reports found for testing');
      return;
    }

    console.log(`🧪 Testing with user: ${testUser.name || 'No name'} (${testUser.email})`);
    console.log(`   User has ${testUser._count.reportFiles} reports\n`);

    // Test 1: Get current onboarding state
    console.log('📋 Test 1: Getting current onboarding state...');
    const currentState = await getUserOnboardingState(testUser.id);
    console.log('   Current state:', {
      needsOnboarding: currentState.needsOnboarding,
      currentStep: currentState.currentStep,
      reportCount: currentState.progress.reportCount,
      firstReportUploaded: currentState.progress.firstReportUploaded,
      secondReportUploaded: currentState.progress.secondReportUploaded,
    });

    // Test 2: Test markFirstReportUploaded function
    console.log('\n📋 Test 2: Testing markFirstReportUploaded function...');
    const firstResult = await markFirstReportUploaded(testUser.id);
    console.log(`   Result: ${firstResult ? 'SUCCESS' : 'FAILED'}`);

    if (firstResult) {
      const updatedState = await getUserOnboardingState(testUser.id);
      console.log('   Updated state:', {
        currentStep: updatedState.currentStep,
        firstReportUploaded: updatedState.progress.firstReportUploaded,
      });
    }

    // Test 3: Test markSecondReportUploaded function (if user has 2+ reports)
    if (testUser._count.reportFiles >= 2) {
      console.log('\n📋 Test 3: Testing markSecondReportUploaded function...');
      const secondResult = await markSecondReportUploaded(testUser.id);
      console.log(`   Result: ${secondResult ? 'SUCCESS' : 'FAILED'}`);

      if (secondResult) {
        const updatedState = await getUserOnboardingState(testUser.id);
        console.log('   Updated state:', {
          currentStep: updatedState.currentStep,
          secondReportUploaded: updatedState.progress.secondReportUploaded,
        });
      }
    }

    // Test 4: Simulate the reports API logic
    console.log('\n📋 Test 4: Simulating reports API onboarding integration...');
    
    const reportCount = await prisma.reportFile.count({
      where: { userId: testUser.id }
    });

    console.log(`   User has ${reportCount} reports`);

    if (reportCount === 1) {
      console.log('   Would call markFirstReportUploaded()');
      const result = await markFirstReportUploaded(testUser.id);
      console.log(`   Result: ${result ? 'SUCCESS' : 'FAILED'}`);
    } else if (reportCount === 2) {
      console.log('   Would call markSecondReportUploaded()');
      const result = await markSecondReportUploaded(testUser.id);
      console.log(`   Result: ${result ? 'SUCCESS' : 'FAILED'}`);
    } else if (reportCount > 2) {
      console.log('   User has more than 2 reports - onboarding should be complete');
    }

    // Test 5: Final state check
    console.log('\n📋 Test 5: Final onboarding state check...');
    const finalState = await getUserOnboardingState(testUser.id);
    console.log('   Final state:', {
      needsOnboarding: finalState.needsOnboarding,
      currentStep: finalState.currentStep,
      completedSteps: finalState.completedSteps,
      progress: finalState.progress,
    });

    // Test 6: Check database consistency
    console.log('\n📋 Test 6: Database consistency check...');
    const userFromDb = await prisma.user.findUnique({
      where: { id: testUser.id },
      select: {
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
    });

    console.log('   Database state:', {
      reportCount: userFromDb._count.reportFiles,
      onboardingCompleted: userFromDb.onboardingCompleted,
      onboardingStep: userFromDb.onboardingStep,
      profileCompleted: userFromDb.profileCompleted,
      firstReportUploaded: userFromDb.firstReportUploaded,
      secondReportUploaded: userFromDb.secondReportUploaded,
    });

    // Validate consistency
    const hasReports = userFromDb._count.reportFiles > 0;
    const shouldHaveFirst = userFromDb._count.reportFiles >= 1;
    const shouldHaveSecond = userFromDb._count.reportFiles >= 2;

    console.log('\n✅ Consistency Check:');
    console.log(`   Has reports: ${hasReports}`);
    console.log(`   Should have first flag: ${shouldHaveFirst} | Actual: ${userFromDb.firstReportUploaded} | ${shouldHaveFirst === userFromDb.firstReportUploaded ? '✅' : '❌'}`);
    console.log(`   Should have second flag: ${shouldHaveSecond} | Actual: ${userFromDb.secondReportUploaded} | ${shouldHaveSecond === userFromDb.secondReportUploaded ? '✅' : '❌'}`);

    if (shouldHaveFirst === userFromDb.firstReportUploaded && shouldHaveSecond === userFromDb.secondReportUploaded) {
      console.log('\n🎉 All tests passed! Onboarding integration is working correctly.');
    } else {
      console.log('\n❌ Consistency issues detected. Onboarding flags may need fixing.');
    }

  } catch (error) {
    console.error('❌ Error testing onboarding report integration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testOnboardingReportIntegration();