#!/usr/bin/env node

/**
 * Diagnostic script to investigate onboarding system issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing Onboarding System Issues...\n');

// Check onboarding-related files
const onboardingFiles = [
  'src/app/onboarding/page.tsx',
  'src/hooks/use-onboarding.ts',
  'src/lib/onboarding-utils.ts',
  'src/types/onboarding.ts',
  'src/app/api/onboarding/route.ts',
  'src/components/onboarding-router.tsx',
  'src/components/onboarding-checklist.tsx',
  'src/components/onboarding-aware-dashboard.tsx'
];

console.log('1. Checking onboarding file structure...');
onboardingFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} (missing)`);
  }
});

// Check main app files that might affect onboarding
console.log('\n2. Checking main app integration...');
const mainFiles = [
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/dashboard/page.tsx'
];

mainFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} (missing)`);
  }
});

console.log('\n3. Analyzing potential issues...');

// Check if onboarding hook exists and examine its content
if (fs.existsSync('src/hooks/use-onboarding.ts')) {
  const hookContent = fs.readFileSync('src/hooks/use-onboarding.ts', 'utf8');
  console.log('   📋 Onboarding hook analysis:');
  
  const checks = [
    { test: hookContent.includes('useState'), name: 'State management' },
    { test: hookContent.includes('useEffect'), name: 'Effect hooks' },
    { test: hookContent.includes('session'), name: 'Session integration' },
    { test: hookContent.includes('onboardingComplete'), name: 'Completion tracking' },
    { test: hookContent.includes('API'), name: 'API calls' }
  ];
  
  checks.forEach(check => {
    console.log(`      ${check.test ? '✅' : '⚠️ '} ${check.name}`);
  });
}

// Check onboarding page
if (fs.existsSync('src/app/onboarding/page.tsx')) {
  const pageContent = fs.readFileSync('src/app/onboarding/page.tsx', 'utf8');
  console.log('\n   📋 Onboarding page analysis:');
  
  const pageChecks = [
    { test: pageContent.includes('useSession'), name: 'Session usage' },
    { test: pageContent.includes('redirect'), name: 'Redirect logic' },
    { test: pageContent.includes('onboarding'), name: 'Onboarding components' },
    { test: pageContent.includes('client'), name: 'Client component' }
  ];
  
  pageChecks.forEach(check => {
    console.log(`      ${check.test ? '✅' : '⚠️ '} ${check.name}`);
  });
}

// Check dashboard integration
if (fs.existsSync('src/app/dashboard/page.tsx')) {
  const dashboardContent = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
  console.log('\n   📋 Dashboard onboarding integration:');
  
  const dashboardChecks = [
    { test: dashboardContent.includes('onboarding'), name: 'Onboarding awareness' },
    { test: dashboardContent.includes('useOnboarding'), name: 'Onboarding hook usage' },
    { test: dashboardContent.includes('redirect'), name: 'Redirect to onboarding' }
  ];
  
  dashboardChecks.forEach(check => {
    console.log(`      ${check.test ? '✅' : '⚠️ '} ${check.name}`);
  });
}

// Check API route
if (fs.existsSync('src/app/api/onboarding/route.ts')) {
  const apiContent = fs.readFileSync('src/app/api/onboarding/route.ts', 'utf8');
  console.log('\n   📋 Onboarding API analysis:');
  
  const apiChecks = [
    { test: apiContent.includes('GET'), name: 'GET handler' },
    { test: apiContent.includes('POST'), name: 'POST handler' },
    { test: apiContent.includes('session'), name: 'Session handling' },
    { test: apiContent.includes('database'), name: 'Database operations' }
  ];
  
  apiChecks.forEach(check => {
    console.log(`      ${check.test ? '✅' : '⚠️ '} ${check.name}`);
  });
}

console.log('\n4. Common onboarding issues to check:');
console.log('   🔍 Session state not properly initialized');
console.log('   🔍 Database connection issues');
console.log('   🔍 Onboarding completion flag not being set/checked');
console.log('   🔍 Redirect logic not working after login');
console.log('   🔍 Client/server hydration mismatch');
console.log('   🔍 API route not responding correctly');

console.log('\n5. Debugging steps to try:');
console.log('   1. Check browser console for JavaScript errors');
console.log('   2. Verify database connection and user table');
console.log('   3. Test onboarding API endpoint directly');
console.log('   4. Check if session data includes onboarding status');
console.log('   5. Verify redirect logic after successful login');

console.log('\n6. Files to examine for recent changes:');
console.log('   - Authentication flow changes');
console.log('   - Session provider modifications');
console.log('   - Database schema changes');
console.log('   - Routing configuration');

console.log('\n💡 Next steps:');
console.log('   Run this script to see which specific files might have issues');
console.log('   Check the browser network tab for failed API calls');
console.log('   Look at server logs for any error messages');
console.log('   Test with a fresh user account to isolate the issue');