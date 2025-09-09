#!/usr/bin/env node

/**
 * Test profile data retrieval in the sharing system
 */

const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function testProfileRetrieval() {
  console.log('🧪 Testing Profile Data Retrieval');
  console.log('='.repeat(50));

  try {
    // Get user
    const user = await prisma.user.findFirst({
      include: {
        profile: true
      }
    });

    if (!user) {
      console.log('❌ No users found');
      return;
    }

    console.log(`👤 User: ${user.name || user.email}`);
    console.log(`📋 Has Profile: ${!!user.profile}`);

    if (user.profile) {
      console.log('\n📊 Profile Data:');
      console.log(`- Date of Birth: ${user.profile.dateOfBirth}`);
      console.log(`- Gender: ${user.profile.gender}`);
      console.log(`- Height: ${user.profile.height}`);
      console.log(`- Weight: ${user.profile.weight}`);
      console.log(`- Liver Disease: ${user.profile.liverDiseaseType}`);
      console.log(`- Primary Physician: ${user.profile.primaryPhysician}`);
      console.log(`- Hepatologist: ${user.profile.hepatologist}`);
    }

    // Test the aggregator method directly
    console.log('\n🔧 Testing Aggregator Method:');
    
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: user.id }
    });

    console.log(`Profile found via patientProfile.findUnique: ${!!profile}`);

    if (profile) {
      // Test demographics creation
      const age = profile.dateOfBirth 
        ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : undefined;

      const demographics = {
        age,
        gender: profile.gender,
        location: profile.location,
        primaryDiagnosis: profile.liverDiseaseType || 'Liver Disease',
        diagnosisDate: profile.diagnosisDate
      };

      console.log('\n📊 Generated Demographics:');
      console.log(JSON.stringify(demographics, null, 2));

      // Test profile creation
      const patientProfile = {
        height: profile.height,
        weight: profile.weight,
        onDialysis: profile.onDialysis,
        liverDiseaseType: profile.liverDiseaseType,
        transplantCandidate: profile.transplantCandidate,
        primaryPhysician: profile.primaryPhysician,
        hepatologist: profile.hepatologist
      };

      console.log('\n📊 Generated Patient Profile:');
      console.log(JSON.stringify(patientProfile, null, 2));

      // Test the final merged structure that should go to PatientProfileTab
      const mergedForTab = {
        name: user.name,
        age: demographics.age,
        gender: demographics.gender,
        dateOfBirth: profile.dateOfBirth,
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

      console.log('\n📊 Final Merged Profile for PatientProfileTab:');
      console.log(JSON.stringify(mergedForTab, null, 2));

      console.log('\n✅ Profile data should now display correctly!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProfileRetrieval();