#!/usr/bin/env node

/**
 * Debug Actual Lab Data Structure
 * 
 * Let's see what the real data structure looks like that's causing 0,1,2,3...
 */

console.log('🔍 Debugging Actual Lab Data Structure...\n');

// Let's create a test to simulate what might be happening
const simulateActualDataStructure = () => {
  // This might be what we're actually receiving
  const possibleDataStructures = [
    {
      name: 'Structure 1 - Array with indices as keys',
      data: {
        extractedData: {
          0: { value: 43, unit: 'Lakhs/Cumm', name: 'Platelets' },
          1: { value: 0.58, unit: 'mg/dL', name: 'Bilirubin' },
          2: { value: 13.6, unit: 'g/dL', name: 'Hemoglobin' },
          3: { value: 40.4, unit: '%', name: 'Hematocrit' },
          4: { value: 4.43, unit: 'Millions/cumm', name: 'RBC' },
          5: { value: 4.5, unit: 'Thousands/cumm', name: 'WBC' }
        }
      }
    },
    {
      name: 'Structure 2 - Object with numeric string keys',
      data: {
        extractedData: {
          '0': { value: 43, unit: 'Lakhs/Cumm', name: 'Platelets' },
          '1': { value: 0.58, unit: 'mg/dL', name: 'Bilirubin' },
          '2': { value: 13.6, unit: 'g/dL', name: 'Hemoglobin' }
        }
      }
    },
    {
      name: 'Structure 3 - Proper array',
      data: {
        extractedData: [
          { value: 43, unit: 'Lakhs/Cumm', name: 'Platelets' },
          { value: 0.58, unit: 'mg/dL', name: 'Bilirubin' },
          { value: 13.6, unit: 'g/dL', name: 'Hemoglobin' }
        ]
      }
    }
  ];

  possibleDataStructures.forEach((structure, index) => {
    console.log(`\n${index + 1}. ${structure.name}:`);
    console.log('   Data:', JSON.stringify(structure.data, null, 2));
    
    // Test how Object.entries() would handle this
    if (structure.data.extractedData) {
      const entries = Object.entries(structure.data.extractedData);
      console.log('   Object.entries() result:');
      entries.forEach(([key, value]) => {
        console.log(`     Key: "${key}" -> Value:`, value);
      });
      
      // This is what would show in UI
      console.log('   What shows in UI:');
      entries.forEach(([key, value]) => {
        console.log(`     ${key}: ${value.value} ${value.unit}`);
      });
    }
  });
};

simulateActualDataStructure();

console.log('\n🎯 The Problem:');
console.log('   If extractedData is an object with numeric keys (0,1,2...),');
console.log('   Object.entries() will use those keys as the display names!');

console.log('\n🔧 Solution:');
console.log('   We need to check if extractedData is an object with numeric keys');
console.log('   and convert it to use the actual metric names from the value.name property');