#!/usr/bin/env node

/**
 * Debug script to check patient profile data flow in sharing system
 */

console.log('🔍 Debugging Patient Profile Data Flow');
console.log('='.repeat(60));

// Test the data structure that should be passed to PatientProfileTab
const testMedicalData = {
  patient: {
    id: 'patient_12345678',
    demographics: {
      age: 45,
      gender: 'Male',
      location: 'New York',
      primaryDiagnosis: 'Liver Disease',
      diagnosisDate: new Date('2023-01-15')
    },
    profile: {
      height: 175,
      weight: 80,
      onDialysis: false,
      transplantCandidate: true,
      liverDiseaseType: 'Cirrhosis',
      alcoholUse: 'None',
      smokingStatus: 'Never',
      primaryPhysician: 'Dr. Smith',
      hepatologist: 'Dr. Johnson'
    }
  },
  reports: {
    individual: [],
    trends: []
  }
};

console.log('📊 Expected Medical Data Structure:');
console.log('- medicalData.patient:', !!testMedicalData.patient);
console.log('- medicalData.patient.demographics:', !!testMedicalData.patient.demographics);
console.log('- medicalData.patient.profile:', !!testMedicalData.patient.profile);

console.log('\n🔍 Current Issue Analysis:');
console.log('1. PatientProfileTab expects: profile prop');
console.log('2. ProfessionalMedicalView passes: medicalData?.patient');
console.log('3. Correct data should be: medicalData?.patient?.profile');

console.log('\n📋 Patient Profile Tab Expected Props:');
console.log('- profile.name (from demographics)');
console.log('- profile.age (from demographics)');
console.log('- profile.gender (from demographics)');
console.log('- profile.dateOfBirth (calculated from age)');
console.log('- profile.primaryDiagnosis (from demographics)');
console.log('- profile.height (from profile)');
console.log('- profile.weight (from profile)');
console.log('- profile.onDialysis (from profile)');
console.log('- profile.liverDiseaseType (from profile)');

console.log('\n🔧 Required Fixes:');
console.log('1. Update ProfessionalMedicalView to pass correct profile data');
console.log('2. Merge demographics and profile data for PatientProfileTab');
console.log('3. Ensure MedicalDataAggregator creates proper structure');

console.log('\n🎯 Fix Strategy:');
console.log('Option 1: Update ProfessionalMedicalView to merge patient data');
console.log('Option 2: Update PatientProfileTab to handle nested structure');
console.log('Option 3: Update MedicalDataAggregator to flatten structure');

console.log('\n' + '='.repeat(60));
console.log('Debug completed - Ready to implement fix');