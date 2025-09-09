#!/usr/bin/env node

/**
 * Test script to verify the React key fix in trends analysis tab
 */

console.log('🔧 Testing Trends Analysis Tab Key Fix');
console.log('='.repeat(50));

// Test the fix by checking the file content
const fs = require('fs');
const path = require('path');

try {
  const filePath = path.join(__dirname, 'src/components/medical-sharing/trends-analysis-tab.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log('✅ File read successfully');
  
  // Check for the fixed key prop
  const hasKeyProp = content.includes('key={`trend-chart-${index}-${series.name}`}');
  const hasProperMapping = content.includes('trends.map((series, index) => (');
  
  console.log('\n📋 Fix Verification:');
  console.log(`- Key prop added: ${hasKeyProp ? '✅' : '❌'}`);
  console.log(`- Proper mapping structure: ${hasProperMapping ? '✅' : '❌'}`);
  
  if (hasKeyProp && hasProperMapping) {
    console.log('\n🎉 SUCCESS: React key error should be fixed!');
    console.log('\n📝 What was fixed:');
    console.log('- Added unique key prop to each trend chart');
    console.log('- Used combination of index and series name for uniqueness');
    console.log('- Wrapped the createTrendChart call in a div with key');
    
    console.log('\n🧪 Testing Steps:');
    console.log('1. Navigate to a share link with trends data');
    console.log('2. Click on the "Trends" tab');
    console.log('3. Check browser console - no key warnings should appear');
    console.log('4. Verify all trend charts render correctly');
  } else {
    console.log('\n❌ ISSUE: Fix may not have been applied correctly');
  }
  
} catch (error) {
  console.error('❌ Error reading file:', error.message);
}

console.log('\n' + '='.repeat(50));
console.log('Test completed');