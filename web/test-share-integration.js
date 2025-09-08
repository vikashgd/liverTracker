#!/usr/bin/env node

/**
 * Test script to verify share button integration in reports interface
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Share Button Integration...\n');

// Test 1: Check if imports are added
const reportsInterfacePath = path.join(__dirname, 'src/components/reports-interface.tsx');
const reportsInterfaceContent = fs.readFileSync(reportsInterfacePath, 'utf8');

console.log('✅ Test 1: Checking imports...');
const hasShareImports = reportsInterfaceContent.includes('QuickShareButton') && 
                             reportsInterfaceContent.includes('ShareWithDoctorButton') &&
                             reportsInterfaceContent.includes('from "./medical-sharing/share-report-button"');
console.log(`   Share button imports: ${hasShareImports ? '✅ Found' : '❌ Missing'}`);

// Test 2: Check if individual report share buttons are added
console.log('\n✅ Test 2: Checking individual report share buttons...');
const hasQuickShareDesktop = reportsInterfaceContent.includes('<QuickShareButton') && 
                             reportsInterfaceContent.includes('reportId={report.id}');
console.log(`   Desktop quick share button: ${hasQuickShareDesktop ? '✅ Found' : '❌ Missing'}`);

const hasQuickShareMobile = reportsInterfaceContent.match(/<QuickShareButton[\s\S]*?className="inline-flex items-center px-3 py-2 text-xs/);
console.log(`   Mobile quick share button: ${hasQuickShareMobile ? '✅ Found' : '❌ Missing'}`);

// Test 3: Check if visit-level share buttons are added
console.log('\n✅ Test 3: Checking visit-level share buttons...');
const hasVisitShareButton = reportsInterfaceContent.includes('<ShareWithDoctorButton') && 
                           reportsInterfaceContent.includes('reportIds={visit.reports.map(r => r.id)}');
console.log(`   Visit-level share button: ${hasVisitShareButton ? '✅ Found' : '❌ Missing'}`);

// Test 4: Check if global share button is added
console.log('\n✅ Test 4: Checking global share button...');
const hasGlobalShareButton = reportsInterfaceContent.includes('reportIds={reports.map(r => r.id)}') &&
                            reportsInterfaceContent.includes('reports.length > 0');
console.log(`   Global share button: ${hasGlobalShareButton ? '✅ Found' : '❌ Missing'}`);

// Test 5: Check if share management link is added
console.log('\n✅ Test 5: Checking share management link...');
const hasShareManagementLink = reportsInterfaceContent.includes('href="/share-management"') &&
                              reportsInterfaceContent.includes('Manage Shares');
console.log(`   Share management link: ${hasShareManagementLink ? '✅ Found' : '❌ Missing'}`);

// Test 6: Check if share components exist
console.log('\n✅ Test 6: Checking share component files...');
const shareButtonPath = path.join(__dirname, 'src/components/medical-sharing/share-report-button.tsx');
const shareModalPath = path.join(__dirname, 'src/components/medical-sharing/share-creation-modal.tsx');
const shareManagementPath = path.join(__dirname, 'src/app/share-management/page.tsx');

console.log(`   Share button component: ${fs.existsSync(shareButtonPath) ? '✅ Found' : '❌ Missing'}`);
console.log(`   Share modal component: ${fs.existsSync(shareModalPath) ? '✅ Found' : '❌ Missing'}`);
console.log(`   Share management page: ${fs.existsSync(shareManagementPath) ? '✅ Found' : '❌ Missing'}`);

// Summary
console.log('\n📊 Integration Summary:');
const allTests = [
  hasShareImports,
  hasQuickShareDesktop,
  hasQuickShareMobile,
  hasVisitShareButton,
  hasGlobalShareButton,
  hasShareManagementLink,
  fs.existsSync(shareButtonPath),
  fs.existsSync(shareModalPath),
  fs.existsSync(shareManagementPath)
];

const passedTests = allTests.filter(Boolean).length;
const totalTests = allTests.length;

console.log(`   Passed: ${passedTests}/${totalTests} tests`);
console.log(`   Status: ${passedTests === totalTests ? '🎉 All tests passed!' : '⚠️  Some tests failed'}`);

if (passedTests === totalTests) {
  console.log('\n🚀 Share button integration is complete and ready to use!');
  console.log('\n📋 Integration Features:');
  console.log('   • Individual report sharing with QuickShareButton');
  console.log('   • Visit-level sharing for multiple reports');
  console.log('   • Global sharing for all reports');
  console.log('   • Share management page access');
  console.log('   • Mobile-responsive design');
  console.log('\n🎯 Next Steps:');
  console.log('   1. Test the sharing functionality in the browser');
  console.log('   2. Create some test share links');
  console.log('   3. Verify the professional medical view works');
  console.log('   4. Test the share management interface');
} else {
  console.log('\n❌ Integration incomplete. Please check the failed tests above.');
}