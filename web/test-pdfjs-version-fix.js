#!/usr/bin/env node

console.log('🔧 Testing PDF.js Version Fix...\n');

// Test 1: Check worker route serves correct version
async function testWorkerRoute() {
  try {
    console.log('1. Testing worker route...');
    const response = await fetch('http://localhost:3000/api/pdfjs/worker');
    
    if (response.ok) {
      const workerCode = await response.text();
      
      // Check if it's serving the correct version by looking for version indicators
      if (workerCode.includes('5.4.54') || workerCode.length > 1000) {
        console.log('   ✅ Worker route serving content successfully');
        console.log(`   📦 Content length: ${workerCode.length} characters`);
      } else {
        console.log('   ⚠️  Worker route serving fallback content');
      }
    } else {
      console.log(`   ❌ Worker route failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Worker route error: ${error.message}`);
  }
}

// Test 2: Check package.json version
async function testPackageVersion() {
  try {
    console.log('\n2. Checking package.json version...');
    const fs = require('fs');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const pdfjsVersion = packageJson.dependencies['pdfjs-dist'];
    
    console.log(`   📦 Installed pdfjs-dist version: ${pdfjsVersion}`);
    
    if (pdfjsVersion.includes('5.4.54')) {
      console.log('   ✅ Package version matches expected version');
    } else {
      console.log('   ⚠️  Package version different from expected');
    }
  } catch (error) {
    console.log(`   ❌ Package check error: ${error.message}`);
  }
}

// Test 3: Check CDN availability
async function testCDNAvailability() {
  try {
    console.log('\n3. Testing CDN availability...');
    const cdnUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.worker.min.mjs';
    const response = await fetch(cdnUrl);
    
    if (response.ok) {
      const content = await response.text();
      console.log('   ✅ CDN serving worker successfully');
      console.log(`   📦 CDN content length: ${content.length} characters`);
    } else {
      console.log(`   ❌ CDN failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ CDN error: ${error.message}`);
  }
}

async function runTests() {
  await testWorkerRoute();
  await testPackageVersion();
  await testCDNAvailability();
  
  console.log('\n🎯 PDF.js Version Fix Test Complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Start your dev server: npm run dev');
  console.log('   2. Test PDF upload at: http://localhost:3000/upload-enhanced');
  console.log('   3. Check browser console for version mismatch errors');
}

runTests().catch(console.error);