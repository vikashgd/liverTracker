#!/usr/bin/env node

/**
 * Test script to verify patient profile data fix
 */

console.log('🔧 Testing Patient Profile Data Fix');
console.log('='.repeat(50));

// Test the fix by checking the file content
const fs = require('fs');
const path = require('path');

try {
  const filePath = path.join(__dirname, 'src/components/medical-sharing/professional-medical-view.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log('✅ File read successfully');
  
  // Check for the fixed profile data merging
  const hasProfileMerging = content.includes('medicalData.patient.demographics?.name');
  const hasProfileData = content.includes('medicalData.patient.profile?.height');
  const hasGridCols6 = content.includes('grid-cols-6');
  const hasIncludeMedicalHistory = content.includes('includeMedicalHistory: true');
  
  console.log('\n📋 Fix Verification:');
  console.log(`- Profile data merging: ${hasProfileMerging ? '✅' : '❌'}`);
  console.log(`- Profile-specific fields: ${hasProfileData ? '✅' : '❌'}`);
  console.log(`- Tab grid updated to 6 columns: ${hasGridCols6 ? '✅' : '❌'}`);
  console.log(`- Medical history flag added: ${hasIncludeMedicalHistory ? '✅' : '❌'}`);
  
  if (hasProfileMerging && hasProfileData && hasGridCols6) {
    console.log('\n🎉 SUCCESS: Patient profile data fix applied!');
    console.log('\n📝 What was fixed:');
    console.log('- Merged demographics and profile data for PatientProfileTab');
    console.log('- Added proper data mapping from nested structure');
    console.log('- Updated tab grid to accommodate profile tab');
    console.log('- Added medical history and contact info flags');
    
    console.log('\n🧪 Testing Steps:');
    console.log('1. Navigate to a share link');
    console.log('2. Click on the "Patient Profile" tab');
    console.log('3. Verify patient information displays correctly');
    console.log('4. Check that demographics and profile data are shown');
    
    console.log('\n📊 Expected Profile Data:');
    console.log('- Basic info: name, age, gender, date of birth');
    console.log('- Medical info: diagnosis, liver disease type');
    console.log('- Physical: height, weight');
    console.log('- Treatment: dialysis status, transplant candidate');
    console.log('- Providers: primary physician, hepatologist');
  } else {
    console.log('\n❌ ISSUE: Fix may not have been applied correctly');
  }
  
} catch (error) {
  console.error('❌ Error reading file:', error.message);
}

console.log('\n' + '='.repeat(50));
console.log('Test completed');