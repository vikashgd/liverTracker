/**
 * Test Onboarding Auto-Completion
 * Tests the new smart onboarding detection system
 */

const { PrismaClient } = require('./src/generated/prisma');
const { autoCompleteOnboardingIfReady, checkOnboardingRequirements } = require('./src/lib/onboarding-auto-completion');
const { getUserOnboardingState } = require('./src/lib/onboarding-utils');

const prisma = new PrismaClient();

async function testAutoCompletion() {
  console.log('🧪 TESTING ONBOARDING AUTO-COMPLETION');
  console.log('====================================\n');

  try {
    // Get users who should have completed onboarding but haven't
    const users = await prisma.user.findMany({
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

    console.log(`📊 Found ${users.length} users with incomplete onboarding\n`);

    for (const user of users) {
      console.log(`👤 Testing: ${user.email}`);
      
      // Check requirements
      const requirements = await checkOnboardingRequirements(user.id);
      console.log('📋 Requirements:', requirements);
      
      // Test auto-completion
      const autoCompleted = await autoCompleteOnboardingIfReady(user.id);
      console.log('🎯 Auto-completion result:', autoCompleted);
      
      // Get updated state
      const state = await getUserOnboardingState(user.id);
      console.log('📊 Updated state:', {
        needsOnboarding: state.needsOnboarding,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps
      });
      
      console.log('─'.repeat(50));
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAutoCompletion();