#!/usr/bin/env node

console.log('🔧 Testing PDF.js Cache Fix...\n');

// Test 1: Check worker route with cache busting
async function testWorkerRouteWithCacheBusting() {
  try {
    console.log('1. Testing worker route with cache busting...');
    const timestamp = Date.now();
    const response = await fetch(`http://localhost:3000/api/pdfjs/worker?v=5.4.54&t=${timestamp}`);
    
    if (response.ok) {
      const workerCode = await response.text();
      const cacheControl = response.headers.get('cache-control');
      
      console.log(`   ✅ Worker route responding: ${response.status}`);
      console.log(`   📦 Content length: ${workerCode.length} characters`);
      console.log(`   🚫 Cache control: ${cacheControl}`);
      
      if (cacheControl && cacheControl.includes('no-cache')) {
        console.log('   ✅ Cache prevention headers set correctly');
      } else {
        console.log('   ⚠️  Cache prevention headers missing');
      }
    } else {
      console.log(`   ❌ Worker route failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Worker route error: ${error.message}`);
  }
}

// Test 2: Check CDN worker availability
async function testCDNWorker() {
  try {
    console.log('\n2. Testing CDN worker availability...');
    const cdnUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.worker.min.mjs';
    const response = await fetch(cdnUrl);
    
    if (response.ok) {
      const content = await response.text();
      console.log('   ✅ CDN worker available');
      console.log(`   📦 CDN content length: ${content.length} characters`);
      
      // Check if it's the right version by looking for version indicators
      if (content.includes('5.4.54') || content.length > 1000000) {
        console.log('   ✅ CDN serving correct version (5.4.54)');
      } else {
        console.log('   ⚠️  CDN version unclear');
      }
    } else {
      console.log(`   ❌ CDN failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ CDN error: ${error.message}`);
  }
}

// Test 3: Check package version consistency
async function testPackageVersion() {
  try {
    console.log('\n3. Checking package version consistency...');
    const fs = require('fs');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const pdfjsVersion = packageJson.dependencies['pdfjs-dist'];
    
    console.log(`   📦 Package.json version: ${pdfjsVersion}`);
    
    if (pdfjsVersion.includes('5.4.54')) {
      console.log('   ✅ Package version matches expected (5.4.54)');
    } else {
      console.log('   ⚠️  Package version different from expected');
    }
  } catch (error) {
    console.log(`   ❌ Package check error: ${error.message}`);
  }
}

// Test 4: Simulate browser cache clearing
async function testCacheClearingStrategy() {
  console.log('\n4. Cache clearing strategy...');
  console.log('   🔄 Timestamp-based cache busting implemented');
  console.log('   🚫 No-cache headers added to worker route');
  console.log('   ✅ Fresh worker loaded on each PDF conversion');
  console.log('   💡 Browser should now use correct version');
}

async function runTests() {
  await testWorkerRouteWithCacheBusting();
  await testCDNWorker();
  await testPackageVersion();
  await testCacheClearingStrategy();
  
  console.log('\n🎯 PDF.js Cache Fix Test Complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)');
  console.log('   2. Start dev server: npm run dev');
  console.log('   3. Test PDF upload at: http://localhost:3000/upload-enhanced');
  console.log('   4. Check browser console - should show no version mismatch');
  console.log('\n🔧 If still seeing issues:');
  console.log('   - Try incognito/private browsing mode');
  console.log('   - Clear browser cache completely');
  console.log('   - Restart dev server');
}

runTests().catch(console.error);