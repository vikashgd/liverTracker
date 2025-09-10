#!/usr/bin/env node

const https = require('https');

const testUrl = 'https://web-4s67y5p9o-vikashgds-projects.vercel.app/';

console.log('🔍 Testing deployment access...');
console.log('URL:', testUrl);

https.get(testUrl, (res) => {
  console.log('\n📊 Response Status:', res.statusCode);
  console.log('📋 Headers:');
  Object.entries(res.headers).forEach(([key, value]) => {
    if (key.includes('auth') || key.includes('protection') || key.includes('vercel')) {
      console.log(`  ${key}: ${value}`);
    }
  });

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 401) {
      console.log('\n❌ ISSUE IDENTIFIED: Deployment Protection Enabled');
      console.log('🔧 SOLUTION: Disable deployment protection in Vercel dashboard');
      console.log('📍 Go to: https://vercel.com/vikashgds-projects/web/settings/deployment-protection');
      console.log('⚙️  Set protection to "Disabled" or "Only Preview Deployments"');
    } else if (res.statusCode === 200) {
      console.log('\n✅ SUCCESS: Deployment is accessible!');
      console.log('🎉 Your LiverTracker app is working correctly');
    } else {
      console.log(`\n⚠️  Unexpected status: ${res.statusCode}`);
      console.log('First 200 chars of response:');
      console.log(data.substring(0, 200));
    }
  });

}).on('error', (err) => {
  console.error('❌ Error testing deployment:', err.message);
});