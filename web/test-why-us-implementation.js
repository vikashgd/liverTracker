#!/usr/bin/env node

/**
 * Test script for the "Why Us" page implementation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing "Why Us" Page Implementation...\n');

// Test 1: Check if Why Us page exists
console.log('1. Checking Why Us page...');
const whyUsPath = path.join(__dirname, 'src/app/why-us/page.tsx');
if (fs.existsSync(whyUsPath)) {
  console.log('✅ Why Us page file exists');
  
  const content = fs.readFileSync(whyUsPath, 'utf8');
  const checks = [
    { test: content.includes('WhyUsPage'), name: 'Page component' },
    { test: content.includes('ComparisonSection'), name: 'Comparison section import' },
    { test: content.includes('gradient-to-br'), name: 'Background gradient' },
    { test: content.includes('Why Choose LiverTracker?'), name: 'Page title' },
    { test: content.includes('Medical Accuracy'), name: 'Benefits section' }
  ];
  
  checks.forEach(check => {
    console.log(`   ${check.test ? '✅' : '❌'} ${check.name}`);
  });
} else {
  console.log('❌ Why Us page file not found');
}

// Test 2: Check header navigation updates
console.log('\n2. Checking header navigation...');
const headerPath = path.join(__dirname, 'src/components/landing/landing-header.tsx');
if (fs.existsSync(headerPath)) {
  const headerContent = fs.readFileSync(headerPath, 'utf8');
  const navChecks = [
    { test: headerContent.includes('Why Us'), name: 'Why Us menu item' },
    { test: headerContent.includes('/why-us'), name: 'Why Us link' },
    { test: headerContent.includes('Link href="/why-us"'), name: 'Desktop navigation' },
    { test: headerContent.match(/Why Us.*Contact/s), name: 'Menu order (Features -> Why Us -> Contact)' }
  ];
  
  navChecks.forEach(check => {
    console.log(`   ${check.test ? '✅' : '❌'} ${check.name}`);
  });
} else {
  console.log('❌ Header file not found');
}

// Test 3: Check landing page cleanup
console.log('\n3. Checking landing page cleanup...');
const landingPath = path.join(__dirname, 'src/components/landing/landing-page.tsx');
if (fs.existsSync(landingPath)) {
  const landingContent = fs.readFileSync(landingPath, 'utf8');
  const cleanupChecks = [
    { test: !landingContent.includes('ComparisonSection'), name: 'Comparison section removed from import' },
    { test: !landingContent.includes('<ComparisonSection />'), name: 'Comparison component removed from JSX' },
    { test: landingContent.includes('FeaturesSection'), name: 'Features section still present' },
    { test: landingContent.includes('ComingSoonSection'), name: 'Coming Soon section still present' }
  ];
  
  cleanupChecks.forEach(check => {
    console.log(`   ${check.test ? '✅' : '❌'} ${check.name}`);
  });
} else {
  console.log('❌ Landing page file not found');
}

// Test 4: Check comparison section updates
console.log('\n4. Checking comparison section updates...');
const comparisonPath = path.join(__dirname, 'src/components/landing/comparison-section.tsx');
if (fs.existsSync(comparisonPath)) {
  const comparisonContent = fs.readFileSync(comparisonPath, 'utf8');
  const comparisonChecks = [
    { test: comparisonContent.includes('Feature Comparison'), name: 'Updated section title' },
    { test: !comparisonContent.includes('className="py-20 bg-gray-50"'), name: 'Background removed from component' },
    { test: comparisonContent.includes('className="py-20"'), name: 'Clean section styling' }
  ];
  
  comparisonChecks.forEach(check => {
    console.log(`   ${check.test ? '✅' : '❌'} ${check.name}`);
  });
} else {
  console.log('❌ Comparison section file not found');
}

// Test 5: Try to build the project
console.log('\n5. Testing build compatibility...');
try {
  console.log('   Building project...');
  execSync('npm run build', { 
    stdio: 'pipe',
    cwd: __dirname,
    timeout: 60000
  });
  console.log('✅ Build successful');
} catch (error) {
  console.log('❌ Build failed');
  console.log('   Error:', error.message.split('\n')[0]);
}

console.log('\n' + '='.repeat(60));
console.log('🎉 "Why Us" Page Implementation Testing Complete!');

console.log('\n📋 What was implemented:');
console.log('✨ New dedicated "Why Us" page at /why-us');
console.log('🎨 Beautiful gradient background (blue-purple)');
console.log('📊 Comparison table with enhanced styling');
console.log('🔗 Navigation menu updated with "Why Us" link');
console.log('🧹 Comparison section removed from main homepage');
console.log('💡 Additional benefits section with icons');

console.log('\n🌐 To test locally:');
console.log('1. Run: npm run dev');
console.log('2. Visit: http://localhost:3000');
console.log('3. Click "Why Us" in the navigation menu');
console.log('4. Or visit directly: http://localhost:3000/why-us');

console.log('\n🎯 What you should see:');
console.log('- Hero section with gradient background');
console.log('- Feature comparison table');
console.log('- Additional benefits section with icons');
console.log('- Professional styling throughout');
console.log('- Responsive design for all devices');