#!/usr/bin/env node

/**
 * Test API Route Exists - Verify imports work
 */

console.log('🧪 Testing API Route Import Resolution...\n');

async function testImports() {
  try {
    console.log('📦 Testing ShareLinkService import...');
    const { ShareLinkService } = await import('./src/lib/medical-sharing/share-link-service.js');
    console.log('✅ ShareLinkService imported successfully');
    
    console.log('📦 Testing MedicalDataAggregator import...');
    const { MedicalDataAggregator } = await import('./src/lib/medical-sharing/medical-data-aggregator.js');
    console.log('✅ MedicalDataAggregator imported successfully');
    
    console.log('\n🎯 All imports working correctly!');
    console.log('   The API route should now work properly.');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.log('\n🔧 Possible solutions:');
    console.log('   1. Check file exports');
    console.log('   2. Verify TypeScript compilation');
    console.log('   3. Restart development server');
  }
}

testImports();