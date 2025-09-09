#!/usr/bin/env node

/**
 * Comprehensive debug script for share data flow
 */

const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function debugShareDataFlow() {
  console.log('🔍 Debugging Complete Share Data Flow');
  console.log('='.repeat(60));

  try {
    // 1. Check if we have any users with profile data
    console.log('\n📊 Step 1: Checking User and Profile Data');
    
    const users = await prisma.user.findMany({
      include: {
        profile: true
      },
      take: 3
    });

    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.name || user.email}`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Has Profile: ${!!user.profile}`);
      
      if (user.profile) {
        const profile = user.profile;
        console.log(`   - Profile Data:`);
        console.log(`     * Height: ${profile.height}`);
        console.log(`     * Weight: ${profile.weight}`);
        console.log(`     * Gender: ${profile.gender}`);
        console.log(`     * Date of Birth: ${profile.dateOfBirth}`);
        console.log(`     * Liver Disease Type: ${profile.liverDiseaseType}`);
        console.log(`     * On Dialysis: ${profile.onDialysis}`);
        console.log(`     * Transplant Candidate: ${profile.transplantCandidate}`);
        console.log(`     * Primary Physician: ${profile.primaryPhysician}`);
        console.log(`     * Hepatologist: ${profile.hepatologist}`);
      }
    }

    // 2. Check share links
    console.log('\n📊 Step 2: Checking Share Links');
    
    const shareLinks = await prisma.shareLink.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${shareLinks.length} share links`);
    
    for (const share of shareLinks) {
      console.log(`\n🔗 Share Link: ${share.title}`);
      console.log(`   - Token: ${share.token}`);
      console.log(`   - User ID: ${share.userId}`);
      console.log(`   - Include Profile: ${share.includeProfile}`);
      console.log(`   - Share Type: ${share.shareType}`);
      
      // Check if this user has profile data
      const userWithProfile = await prisma.user.findUnique({
        where: { id: share.userId },
        include: { profile: true }
      });
      
      console.log(`   - User has profile: ${!!userWithProfile?.profile}`);
    }

    // 3. Test the MedicalDataAggregator logic
    console.log('\n📊 Step 3: Testing Data Aggregation Logic');
    
    if (users.length > 0 && shareLinks.length > 0) {
      const testUser = users[0];
      const testShare = shareLinks[0];
      
      console.log(`\n🧪 Testing with User: ${testUser.name || testUser.email}`);
      console.log(`   Share: ${testShare.title}`);
      
      // Simulate the aggregator logic
      const profile = await prisma.profile.findUnique({
        where: { userId: testUser.id }
      });
      
      console.log('\n📋 Raw Profile Data from DB:');
      console.log(JSON.stringify(profile, null, 2));
      
      // Simulate createDemographics
      const demographics = profile ? {
        age: profile.dateOfBirth 
          ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : undefined,
        gender: profile.gender,
        location: profile.location,
        primaryDiagnosis: profile.liverDiseaseType || 'Liver Disease',
        diagnosisDate: profile.diagnosisDate
      } : { primaryDiagnosis: 'Liver Disease' };
      
      console.log('\n📋 Generated Demographics:');
      console.log(JSON.stringify(demographics, null, 2));
      
      // Simulate createPatientProfile
      const patientProfile = profile ? {
        height: profile.height,
        weight: profile.weight,
        onDialysis: profile.onDialysis,
        dialysisSessionsPerWeek: profile.dialysisSessionsPerWeek,
        dialysisStartDate: profile.dialysisStartDate,
        dialysisType: profile.dialysisType,
        liverDiseaseType: profile.liverDiseaseType,
        transplantCandidate: profile.transplantCandidate,
        transplantListDate: profile.transplantListDate,
        alcoholUse: profile.alcoholUse,
        smokingStatus: profile.smokingStatus,
        primaryPhysician: profile.primaryPhysician,
        hepatologist: profile.hepatologist,
        transplantCenter: profile.transplantCenter,
        ascites: profile.ascites,
        encephalopathy: profile.encephalopathy
      } : {
        onDialysis: false,
        transplantCandidate: false
      };
      
      console.log('\n📋 Generated Patient Profile:');
      console.log(JSON.stringify(patientProfile, null, 2));
      
      // Simulate the final structure
      const finalStructure = {
        patient: {
          id: 'patient_' + testUser.id.substring(0, 8),
          demographics,
          profile: patientProfile
        }
      };
      
      console.log('\n📋 Final Medical Data Structure:');
      console.log(JSON.stringify(finalStructure, null, 2));
      
      // Test the merging logic from ProfessionalMedicalView
      const mergedProfile = {
        name: demographics.name || testUser.name,
        age: demographics.age,
        gender: demographics.gender,
        dateOfBirth: profile?.dateOfBirth,
        primaryDiagnosis: demographics.primaryDiagnosis,
        diagnosisDate: demographics.diagnosisDate,
        location: demographics.location,
        height: patientProfile.height,
        weight: patientProfile.weight,
        onDialysis: patientProfile.onDialysis,
        liverDiseaseType: patientProfile.liverDiseaseType,
        transplantCandidate: patientProfile.transplantCandidate,
        primaryPhysician: patientProfile.primaryPhysician,
        hepatologist: patientProfile.hepatologist,
        includeMedicalHistory: true,
        includeContactInfo: false
      };
      
      console.log('\n📋 Merged Profile for PatientProfileTab:');
      console.log(JSON.stringify(mergedProfile, null, 2));
    }

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugShareDataFlow();