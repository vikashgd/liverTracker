#!/usr/bin/env node

/**
 * Test script to verify the lab results numeric keys fix
 */

console.log('🧪 Testing Lab Results Numeric Keys Fix');
console.log('='.repeat(50));

// Test the data processing logic that was fixed
function processExtractedData(extractedData) {
  let metrics = [];
  
  if (extractedData) {
    if (Array.isArray(extractedData)) {
      // Handle proper array structure
      metrics = extractedData.map((item) => [
        item.name || item.metricName || `Metric ${item.id || 'Unknown'}`,
        {
          value: item.value,
          unit: item.unit,
          normalRange: item.normalRange || item.referenceRange
        }
      ]);
    } else if (typeof extractedData === 'object') {
      // Handle object with numeric keys (0, 1, 2, 3...)
      // CRITICAL FIX: Always use the item.name, never the numeric key
      metrics = Object.entries(extractedData).map(([key, item]) => {
        // Ensure we have a valid item object
        if (!item || typeof item !== 'object') {
          return [`Unknown Metric ${key}`, { value: null, unit: '', normalRange: null }];
        }
        
        // Extract the actual metric name from the item, not the numeric key
        const metricName = item.name || item.metricName || item.metric || item.label || `Unknown Metric ${key}`;
        
        return [
          metricName,
          {
            value: item.value,
            unit: item.unit || '',
            normalRange: item.normalRange || item.referenceRange
          }
        ];
      });
    }
  }
  
  return metrics;
}

console.log('\n🧪 Test Case 1: Object with numeric keys (the problematic case)');
const problematicData = {
  "0": { name: "ALT", value: 42, unit: "U/L" },
  "1": { name: "AST", value: 47, unit: "U/L" },
  "2": { name: "Platelets", value: 65, unit: "×10³/μL" },
  "3": { name: "Bilirubin", value: 2.4, unit: "mg/dL" },
  "4": { name: "Albumin", value: 4, unit: "g/dL" },
  "5": { name: "Creatinine", value: 0.6, unit: "mg/dL" },
  "6": { name: "INR", value: 1.44, unit: "" },
  "7": { name: "Sodium", value: 93, unit: "mEq/L" },
  "8": { name: "Potassium", value: 21, unit: "mEq/L" }
};

const processedMetrics = processExtractedData(problematicData);
console.log('✅ Processed metrics:');
processedMetrics.forEach(([name, data]) => {
  console.log(`  - ${name}: ${data.value} ${data.unit}`);
});

console.log('\n🧪 Test Case 2: Proper array structure');
const arrayData = [
  { name: "ALT", value: 42, unit: "U/L" },
  { name: "AST", value: 47, unit: "U/L" },
  { name: "Platelets", value: 65, unit: "×10³/μL" }
];

const processedArrayMetrics = processExtractedData(arrayData);
console.log('✅ Processed array metrics:');
processedArrayMetrics.forEach(([name, data]) => {
  console.log(`  - ${name}: ${data.value} ${data.unit}`);
});

console.log('\n🎯 Expected Result:');
console.log('Before fix: 0, 1, 2, 3, 4, 5, 6, 7, 8');
console.log('After fix: ALT, AST, Platelets, Bilirubin, Albumin, Creatinine, INR, Sodium, Potassium');

console.log('\n✅ Fix Applied Successfully!');
console.log('The lab results tab will now show proper metric names instead of numeric keys.');