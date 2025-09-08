#!/usr/bin/env node

/**
 * Debug script for the medical sharing system
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Medical Sharing System...\n');

// Test 1: Check if all required files exist
console.log('✅ Test 1: Checking required files...');
const requiredFiles = [
  'src/components/medical-sharing/share-creation-modal.tsx',
  'src/components/medical-sharing/share-management-panel.tsx',
  'src/app/api/share-links/route.ts',
  'src/lib/medical-sharing/share-link-service.ts'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Test 2: Check API endpoint structure
console.log('\n✅ Test 2: Checking API endpoints...');
const shareLinksRoute = path.join(__dirname, 'src/app/api/share-links/route.ts');
if (fs.existsSync(shareLinksRoute)) {
  const content = fs.readFileSync(shareLinksRoute, 'utf8');
  const hasPost = content.includes('export async function POST');
  const hasGet = content.includes('export async function GET');
  const returnsShareLinks = content.includes('shareLinks');
  
  console.log(`   POST endpoint: ${hasPost ? '✅' : '❌'}`);
  console.log(`   GET endpoint: ${hasGet ? '✅' : '❌'}`);
  console.log(`   Returns shareLinks: ${returnsShareLinks ? '✅' : '❌'}`);
}

// Test 3: Check share creation modal
console.log('\n✅ Test 3: Checking share creation modal...');
const modalPath = path.join(__dirname, 'src/components/medical-sharing/share-creation-modal.tsx');
if (fs.existsSync(modalPath)) {
  const content = fs.readFileSync(modalPath, 'utf8');
  const hasSuccessStep = content.includes("step === 'success'");
  const hasUrlDisplay = content.includes('createdShare.url');
  const hasCopyFunction = content.includes('copyToClipboard');
  
  console.log(`   Success step: ${hasSuccessStep ? '✅' : '❌'}`);
  console.log(`   URL display: ${hasUrlDisplay ? '✅' : '❌'}`);
  console.log(`   Copy function: ${hasCopyFunction ? '✅' : '❌'}`);
}

// Test 4: Check share management panel
console.log('\n✅ Test 4: Checking share management panel...');
const panelPath = path.join(__dirname, 'src/components/medical-sharing/share-management-panel.tsx');
if (fs.existsSync(panelPath)) {
  const content = fs.readFileSync(panelPath, 'utf8');
  const hasArrayCheck = content.includes('data.shareLinks');
  const hasMapFunction = content.includes('shareLinks.map');
  
  console.log(`   Array extraction: ${hasArrayCheck ? '✅' : '❌'}`);
  console.log(`   Map function: ${hasMapFunction ? '✅' : '❌'}`);
}

console.log('\n📋 Common Issues and Solutions:');
console.log('');
console.log('🔧 Issue 1: "shareLinks.map is not a function"');
console.log('   Solution: API returns { success: true, shareLinks } but frontend expects array');
console.log('   Fix: Use data.shareLinks instead of data');
console.log('');
console.log('🔧 Issue 2: Share link not displayed after creation');
console.log('   Solution: API returns { success: true, shareLink } but frontend expects shareLink directly');
console.log('   Fix: Use data.shareLink instead of data');
console.log('');
console.log('🔧 Issue 3: No email notifications');
console.log('   Solution: Email functionality is not implemented yet');
console.log('   Fix: This is expected - sharing works via link copying');
console.log('');

console.log('🎯 How to use the sharing system:');
console.log('1. Click any green "Share" button next to a report');
console.log('2. Fill in the share details (title, content selection, security)');
console.log('3. Click "Create Share Link"');
console.log('4. Copy the generated link from the success screen');
console.log('5. Share the link with healthcare providers');
console.log('6. Manage shares from the "Manage Shares" link in the header');
console.log('');
console.log('🔗 Share links look like: https://yoursite.com/share/abc123...');
console.log('');
console.log('✨ The system is working correctly if you can:');
console.log('   • Create share links without errors');
console.log('   • See the success screen with a copyable link');
console.log('   • View your shares in the management panel');
console.log('   • Access shared content via the generated links');