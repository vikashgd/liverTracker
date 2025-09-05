#!/usr/bin/env node

/**
 * Quick performance test for the optimized app
 */

const http = require('http');

function timeRequest(path) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ ${path}: ${res.statusCode} (${duration}ms)`);
      resolve(duration);
    });

    req.on('error', (err) => {
      console.log(`❌ ${path}: ${err.message}`);
      reject(err);
    });

    req.on('timeout', () => {
      console.log(`⏰ ${path}: Request timeout (>10s)`);
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runPerformanceTest() {
  console.log('🏃‍♂️ Performance Test - Optimized App on Port 8080\n');

  const tests = [
    { path: '/api/warmup-db', name: 'Database warmup' },
    { path: '/api/health', name: 'Health check' },
    { path: '/', name: 'Home page' },
    { path: '/auth/signin', name: 'Sign in page' },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const duration = await timeRequest(test.path);
      results.push({ name: test.name, duration });
      await new Promise(resolve => setTimeout(resolve, 200)); // Small delay
    } catch (error) {
      results.push({ name: test.name, duration: 'FAILED' });
    }
  }

  console.log('\n📊 Performance Summary:');
  results.forEach(result => {
    const status = typeof result.duration === 'number' 
      ? result.duration < 1000 ? '🟢 FAST' : result.duration < 3000 ? '🟡 OK' : '🔴 SLOW'
      : '❌ FAILED';
    console.log(`${status} ${result.name}: ${result.duration}${typeof result.duration === 'number' ? 'ms' : ''}`);
  });

  const avgTime = results
    .filter(r => typeof r.duration === 'number')
    .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => typeof r.duration === 'number').length;

  if (avgTime) {
    console.log(`\n⚡ Average response time: ${Math.round(avgTime)}ms`);
    if (avgTime < 1000) {
      console.log('🎉 Great! The app is running fast.');
    } else if (avgTime < 3000) {
      console.log('👍 Good performance. The optimizations are working.');
    } else {
      console.log('⚠️ Still slow. May need more optimization.');
    }
  }
}

runPerformanceTest().catch(console.error);