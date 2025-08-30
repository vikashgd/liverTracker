const https = require('https');

console.log('Testing Google OAuth connectivity...');

// Test Google's well-known configuration endpoint
const options = {
  hostname: 'accounts.google.com',
  port: 443,
  path: '/.well-known/openid-configuration',
  method: 'GET',
  timeout: 10000
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const config = JSON.parse(data);
      console.log('✅ Successfully connected to Google OAuth configuration');
      console.log('Authorization endpoint:', config.authorization_endpoint);
      console.log('Token endpoint:', config.token_endpoint);
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.on('timeout', () => {
  console.error('❌ Request timed out');
  req.destroy();
});

req.setTimeout(10000);
req.end();