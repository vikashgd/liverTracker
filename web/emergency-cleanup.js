#!/usr/bin/env node

/**
 * EMERGENCY CLEANUP SCRIPT
 * 
 * This script removes the incorrectly recovered data that may belong to other users
 */

const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function emergencyCleanup() {
  try {
    console.log('🚨 EMERGENCY CLEANUP: Removing incorrectly recovered data...');
    
    const user = await prisma.user.findFirst({
      where: { email: 'vikashgd@gmail.com' }
    });
    
    if (!user) {
      console.error('❌ User not found');
      return;
    }
    
    // Delete all timeline events for this user
    const deletedTimeline = await prisma.timelineEvent.deleteMany({
      where: { userId: user.id }
    });
    
    // Delete all extracted metrics for this user's reports
    const deletedMetrics = await prisma.extractedMetric.deleteMany({
      where: {
        report: {
          userId: user.id
        }
      }
    });
    
    // Delete all report files for this user
    const deletedReports = await prisma.reportFile.deleteMany({
      where: { userId: user.id }
    });
    
    // Reset user onboarding status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingCompleted: false,
        firstReportUploaded: false,
        secondReportUploaded: false,
        onboardingCompletedAt: null
      }
    });
    
    console.log('✅ Cleanup complete:');
    console.log(`- Deleted ${deletedReports.count} report records`);
    console.log(`- Deleted ${deletedMetrics.count} metric records`);
    console.log(`- Deleted ${deletedTimeline.count} timeline events`);
    console.log('- Reset user onboarding status');
    
    console.log('\\n🎯 Your account is now clean. We need to identify your actual files before recovery.');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

emergencyCleanup();