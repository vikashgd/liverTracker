#!/usr/bin/env node

/**
 * Debug Profile Issue - Find out why profile is showing as incomplete
 */

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function debugProfileIssue() {
  console.log('🔍 Debugging Profile Completion Issue\n');

  try {
    // Get the user from logs
    const userId = 'cmg0ip2yc0000l804tadf7ilx';
    
    console.log(`👤 Checking user: ${userId}`);
    
    // Get user with profile and reports
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        reportFiles: {
          select: {
            id: true,
            objectKey: true,
            createdAt: true,
            reportType: true,
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n📊 USER DATA:');
    console.log(`Email: ${user.email}`);
    console.log(`Onboarding Completed: ${user.onboardingCompleted}`);
    console.log(`Profile Completed: ${user.profileCompleted}`);
    console.log(`First Report Uploaded: ${user.firstReportUploaded}`);
    
    console.log('\n👤 PROFILE DATA:');
    if (user.profile) {
      console.log('Profile exists:', {
        gender: user.profile.gender,
        height: user.profile.height,
        weight: user.profile.weight,
        age: user.profile.age,
        dateOfBirth: user.profile.dateOfBirth,
      });
      
      // Check what the atomic checker is looking for
      const profileComplete = !!(
        user.profile.gender && 
        user.profile.height && 
        user.profile.weight
      );
      
      console.log(`\n🎯 PROFILE COMPLETION CHECK:`);
      console.log(`- Has gender: ${!!user.profile.gender}`);
      console.log(`- Has height: ${!!user.profile.height}`);
      console.log(`- Has weight: ${!!user.profile.weight}`);
      console.log(`- Profile Complete: ${profileComplete}`);
      
    } else {
      console.log('❌ No profile found');
    }
    
    console.log('\n📄 REPORTS:');
    console.log(`Report count: ${user.reportFiles.length}`);
    user.reportFiles.forEach((report, index) => {
      console.log(`${index + 1}. ${report.objectKey} (${report.createdAt})`);
    });
    
    console.log('\n🎯 ONBOARDING REQUIREMENTS:');
    const hasProfile = !!user.profile;
    const profileComplete = hasProfile && 
                           !!user.profile?.gender && 
                           !!user.profile?.height && 
                           !!user.profile?.weight;
    const hasReports = user.reportFiles.length > 0;
    const shouldBeComplete = profileComplete && hasReports;
    
    console.log(`- Has profile: ${hasProfile}`);
    console.log(`- Profile complete: ${profileComplete}`);
    console.log(`- Has reports: ${hasReports}`);
    console.log(`- Should be complete: ${shouldBeComplete}`);
    
    if (!profileComplete && hasProfile) {
      console.log('\n❌ PROFILE ISSUE FOUND:');
      console.log('Profile exists but missing required fields:');
      if (!user.profile.gender) console.log('  - Missing gender');
      if (!user.profile.height) console.log('  - Missing height');
      if (!user.profile.weight) console.log('  - Missing weight');
    }
    
    if (shouldBeComplete && !user.onboardingCompleted) {
      console.log('\n🔧 FIXING ONBOARDING STATUS...');
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          onboardingStep: 'complete',
          profileCompleted: true,
          firstReportUploaded: true,
          secondReportUploaded: user.reportFiles.length >= 2,
        }
      });
      
      console.log('✅ Onboarding status fixed!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProfileIssue().catch(console.error);