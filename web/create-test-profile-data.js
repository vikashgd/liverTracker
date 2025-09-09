#!/usr/bin/env node

/**
 * Create test profile data for debugging patient profile display
 */

const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function createTestProfileData() {
  console.log('🔧 Creating Test Profile Data');
  console.log('='.repeat(50));

  try {
    // Get the first user
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    console.log(`👤 Found user: ${user.name || user.email} (${user.id})`);

    // Check if profile already exists
    const existingProfile = await prisma.patientProfile.findUnique({
      where: { userId: user.id }
    });

    if (existingProfile) {
      console.log('📋 Profile already exists. Updating...');
      
      const updatedProfile = await prisma.patientProfile.update({
        where: { userId: user.id },
        data: {
          dateOfBirth: new Date('1980-05-15'),
          gender: 'Male',
          height: 175.5,
          weight: 80.2,
          location: 'New York, NY',
          onDialysis: false,
          liverDiseaseType: 'Cirrhosis',
          diagnosisDate: new Date('2023-01-15'),
          transplantCandidate: true,
          transplantListDate: new Date('2023-06-01'),
          alcoholUse: 'None',
          smokingStatus: 'Never',
          primaryPhysician: 'Dr. Sarah Johnson',
          hepatologist: 'Dr. Michael Chen',
          transplantCenter: 'NYC Liver Transplant Center',
          emergencyContactName: 'Jane Doe',
          emergencyContactPhone: '+1-555-0123',
          emergencyContactRelation: 'Spouse',
          ascites: 'none',
          encephalopathy: 'none',
          completedAt: new Date()
        }
      });

      console.log('✅ Profile updated successfully');
    } else {
      console.log('📋 Creating new profile...');
      
      const newProfile = await prisma.patientProfile.create({
        data: {
          userId: user.id,
          dateOfBirth: new Date('1980-05-15'),
          gender: 'Male',
          height: 175.5,
          weight: 80.2,
          location: 'New York, NY',
          onDialysis: false,
          liverDiseaseType: 'Cirrhosis',
          diagnosisDate: new Date('2023-01-15'),
          transplantCandidate: true,
          transplantListDate: new Date('2023-06-01'),
          alcoholUse: 'None',
          smokingStatus: 'Never',
          primaryPhysician: 'Dr. Sarah Johnson',
          hepatologist: 'Dr. Michael Chen',
          transplantCenter: 'NYC Liver Transplant Center',
          emergencyContactName: 'Jane Doe',
          emergencyContactPhone: '+1-555-0123',
          emergencyContactRelation: 'Spouse',
          ascites: 'none',
          encephalopathy: 'none',
          completedAt: new Date()
        }
      });

      console.log('✅ Profile created successfully');
    }

    // Verify the profile data
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: user.id }
    });

    console.log('\n📊 Profile Data Summary:');
    console.log(`- Age: ${Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years`);
    console.log(`- Gender: ${profile.gender}`);
    console.log(`- Height: ${profile.height} cm`);
    console.log(`- Weight: ${profile.weight} kg`);
    console.log(`- Location: ${profile.location}`);
    console.log(`- Liver Disease: ${profile.liverDiseaseType}`);
    console.log(`- On Dialysis: ${profile.onDialysis}`);
    console.log(`- Transplant Candidate: ${profile.transplantCandidate}`);
    console.log(`- Primary Physician: ${profile.primaryPhysician}`);
    console.log(`- Hepatologist: ${profile.hepatologist}`);

    console.log('\n🎯 Next Steps:');
    console.log('1. Navigate to a share link');
    console.log('2. Click on the "Patient Profile" tab');
    console.log('3. Verify that profile data now displays correctly');

  } catch (error) {
    console.error('❌ Error creating profile data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestProfileData();