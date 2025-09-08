#!/usr/bin/env node

/**
 * Debug script to understand the lab results data structure issue
 */

console.log('🔍 Debugging Lab Results Data Structure Issue');
console.log('='.repeat(50));

// Based on the logs, the backend is working correctly and returning proper metric names
// But the frontend is showing 0,1,2,3 instead of ALT, AST, Platelets, etc.

// Let's simulate what the data should look like vs what might be happening
console.log('\n📊 Expected Data Structure:');
const expectedData = {
  reports: {
    individual: [
      {
        id: 'report-1',
        reportDate: new Date(),
        reportType: 'Lab Report',
        metrics: [
          { id: 'metric-1', name: 'ALT', value: 32, unit: 'U/L' },
          { id: 'metric-2', name: 'AST', value: 28, unit: 'U/L' },
          { id: 'metric-3', name: 'Bilirubin', value: 1.8, unit: 'mg/dL' },
          { id: 'metric-4', name: 'Platelets', value: 180, unit: '×10³/μL' }
        ]
      }
    ]
  }
};

console.log(JSON.stringify(expectedData, null, 2));

console.log('\n🐛 Problematic Data Structure (what might be happening):');
const problematicData = {
  reports: {
    individual: [
      {
        id: 'report-1',
        reportDate: new Date(),
        reportType: 'Lab Report',
        // This might be an array instead of proper metrics
        extractedData: [
          { name: 'ALT', value: 32, unit: 'U/L' },
          { name: 'AST', value: 28, unit: 'U/L' },
          { name: 'Bilirubin', value: 1.8, unit: 'mg/dL' },
          { name: 'Platelets', value: 180, unit: '×10³/μL' }
        ]
      }
    ]
  }
};

console.log(JSON.stringify(problematicData, null, 2));

console.log('\n🔧 Analysis:');
console.log('1. Backend logs show correct metric names (ALT, AST, Platelets, etc.)');
console.log('2. Frontend shows numeric keys (0, 1, 2, 3)');
console.log('3. This suggests the frontend is iterating over array indices instead of using metric names');
console.log('4. The issue is likely in how the lab-results-tab.tsx processes the data');

console.log('\n🎯 Solution:');
console.log('1. Check if extractedData is being used instead of metrics');
console.log('2. Ensure proper mapping from backend data to frontend display');
console.log('3. Fix the data processing logic in lab-results-tab.tsx');

console.log('\n✅ Next Steps:');
console.log('1. Examine the actual data being passed to LabResultsTab component');
console.log('2. Fix the data processing logic to use metric names instead of array indices');
console.log('3. Test the fix with real shared medical data');