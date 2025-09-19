#!/usr/bin/env node

/**
 * TEST FRONTEND DEDUPLICATION
 * Test the frontend deduplication logic
 */

console.log('🧪 TESTING FRONTEND DEDUPLICATION LOGIC');
console.log('=======================================\n');

// Simulate the deduplication logic from the component
function deduplicateMetrics(allMetrics) {
  return allMetrics.reduce((acc, metric) => {
    const existingIndex = acc.findIndex(m => m.name === metric.name);
    if (existingIndex >= 0) {
      // Keep the one with the most recent createdAt or the one with a category
      const existing = acc[existingIndex];
      const current = metric;
      
      // Prefer the one with category, or the more recent one
      if (current.category && !existing.category) {
        acc[existingIndex] = current;
      } else if (!current.category && existing.category) {
        // Keep existing
      } else {
        // Both have category or both don't - use createdAt
        const existingDate = new Date(existing.createdAt || 0);
        const currentDate = new Date(current.createdAt || 0);
        if (currentDate > existingDate) {
          acc[existingIndex] = current;
        }
      }
    } else {
      acc.push(metric);
    }
    return acc;
  }, []);
}

// Test case 1: Duplicates with different categories
console.log('📋 Test Case 1: Duplicates with different categories');
const testMetrics1 = [
  { name: 'Platelets', value: 82, unit: '10^9/L', category: null, createdAt: '2024-01-01T10:00:00Z' },
  { name: 'Platelets', value: 82, unit: '10^9/L', category: 'hematology', createdAt: '2024-01-01T10:01:00Z' },
  { name: 'INR', value: 1.16, unit: 'ratio', category: null, createdAt: '2024-01-01T10:00:00Z' },
  { name: 'INR', value: 1.16, unit: 'ratio', category: 'coagulation', createdAt: '2024-01-01T10:01:00Z' }
];

const deduplicated1 = deduplicateMetrics(testMetrics1);
console.log(`Input: ${testMetrics1.length} metrics`);
console.log(`Output: ${deduplicated1.length} metrics`);
console.log('Deduplicated metrics:');
deduplicated1.forEach(m => {
  console.log(`  - ${m.name}: ${m.value} ${m.unit} (category: ${m.category || 'none'})`);
});

// Test case 2: Duplicates with same category but different timestamps
console.log('\n📋 Test Case 2: Duplicates with same category, different timestamps');
const testMetrics2 = [
  { name: 'ALT', value: 25, unit: 'U/L', category: 'liver_function', createdAt: '2024-01-01T10:00:00Z' },
  { name: 'ALT', value: 25, unit: 'U/L', category: 'liver_function', createdAt: '2024-01-01T10:02:00Z' },
  { name: 'AST', value: 32, unit: 'U/L', category: 'liver_function', createdAt: '2024-01-01T10:00:00Z' },
  { name: 'AST', value: 32, unit: 'U/L', category: 'liver_function', createdAt: '2024-01-01T10:01:00Z' }
];

const deduplicated2 = deduplicateMetrics(testMetrics2);
console.log(`Input: ${testMetrics2.length} metrics`);
console.log(`Output: ${deduplicated2.length} metrics`);
console.log('Deduplicated metrics:');
deduplicated2.forEach(m => {
  console.log(`  - ${m.name}: ${m.value} ${m.unit} (created: ${m.createdAt})`);
});

// Test case 3: No duplicates
console.log('\n📋 Test Case 3: No duplicates');
const testMetrics3 = [
  { name: 'Albumin', value: 3.96, unit: 'g/dL', category: 'liver_function', createdAt: '2024-01-01T10:00:00Z' },
  { name: 'Creatinine', value: 0.66, unit: 'mg/dL', category: 'kidney_function', createdAt: '2024-01-01T10:00:00Z' },
  { name: 'Sodium', value: 140.3, unit: 'mEq/L', category: 'electrolytes', createdAt: '2024-01-01T10:00:00Z' }
];

const deduplicated3 = deduplicateMetrics(testMetrics3);
console.log(`Input: ${testMetrics3.length} metrics`);
console.log(`Output: ${deduplicated3.length} metrics`);
console.log('All metrics should remain unchanged');

console.log('\n✅ FRONTEND DEDUPLICATION TESTS COMPLETE');
console.log('========================================');
console.log('The frontend deduplication logic should now prevent duplicate metrics from displaying');
console.log('even if they exist in the database.');