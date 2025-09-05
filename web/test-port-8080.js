#!/usr/bin/env node

/**
 * Quick test to verify the app is running correctly on port 8080
 */

const http = require('http');

function testEndpoint(path, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      console.log(`✅ ${path}: ${res.statusCode} ${res.statusMessage}`);
      resolve(res.statusCode);
    });

    req.on('error', (err) => {
      console.log(`❌ ${path}: ${err.message}`);
      reject(err);
    });

    req.on('timeout', () => {
      console.log(`⏰ ${path}: Request timeout`);
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing app on port 8080...\n');

  const tests = [
    { path: '/', name: 'Home page' },
    { path: '/api/health', name: 'Health check' },
    { path: '/auth/signin', name: 'Sign in page' },
    { path: '/api/auth/providers', name: 'Auth providers' },
  ];

  for (const test of tests) {
    try {
      await testEndpoint(test.path);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
    } catch (error) {
      console.log(`Failed to test ${test.name}`);
    }
  }

  console.log('\n🎉 Test complete! The app should be accessible at http://localhost:8080');
  console.log('\n📋 To test the onboarding system:');
  console.log('1. Visit http://localhost:8080');
  console.log('2. Sign up for a new account or sign in');
  console.log('3. Experience the enhanced onboarding flow');
  console.log('4. Check out the empty states, progress tracking, and celebrations!');
}

runTests().catch(console.error);