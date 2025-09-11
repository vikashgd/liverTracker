#!/usr/bin/env node

/**
 * Quick verification that the comparison table is properly set up
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Comparison Table Setup...\n');

const checks = [
  {
    name: 'Comparison Component',
    path: 'src/components/landing/comparison-section.tsx',
    required: ['ComparisonSection', 'LiverTracker', 'grid-cols-6']
  },
  {
    name: 'Landing Page Integration',
    path: 'src/components/landing/landing-page.tsx',
    required: ['ComparisonSection', '<ComparisonSection />']
  },
  {
    name: 'Index Exports',
    path: 'src/components/landing/index.ts',
    required: ['ComparisonSection']
  },
  {
    name: 'Package.json',
    path: 'package.json',
    required: ['next', 'react']
  }
];

let allGood = true;

checks.forEach((check, index) => {
  console.log(`${index + 1}. Checking ${check.name}...`);
  
  if (fs.existsSync(check.path)) {
    const content = fs.readFileSync(check.path, 'utf8');
    const missing = check.required.filter(req => !content.includes(req));
    
    if (missing.length === 0) {
      console.log('   ✅ All required elements found');
    } else {
      console.log(`   ❌ Missing: ${missing.join(', ')}`);
      allGood = false;
    }
  } else {
    console.log(`   ❌ File not found: ${check.path}`);
    allGood = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('🎉 Everything looks good! Ready to run locally.');
  console.log('\n📋 To start development server:');
  console.log('   npm run dev');
  console.log('   # OR');
  console.log('   node run-local-dev.js');
  console.log('\n🌐 Then visit: http://localhost:3000');
  console.log('🎯 Look for "Why Choose LiverTracker?" section');
} else {
  console.log('⚠️  Some issues found. Please check the files above.');
}

console.log('\n💡 What you should see:');
console.log('   - Beautiful 6-column comparison table');
console.log('   - LiverTracker column highlighted in blue');
console.log('   - Green ✓, yellow ⚠️, red ❌ status icons');
console.log('   - Professional styling with shadows and spacing');
console.log('   - Call-to-action button at the bottom');
console.log('   - Responsive design that works on mobile');