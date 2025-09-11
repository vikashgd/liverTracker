// OAuth Configuration Test
console.log('🔍 Testing OAuth Configuration...\n');

// Test environment variables
const requiredEnvVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET', 
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
];

console.log('📋 Environment Variables Check:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${envVar === 'NEXTAUTH_URL' ? value : '***set***'}`);
  } else {
    console.log(`❌ ${envVar}: NOT SET`);
  }
});

console.log('\n🌐 Expected OAuth URLs:');
const baseUrl = process.env.NEXTAUTH_URL || 'https://livertracker.com';
console.log(`📍 Base URL: ${baseUrl}`);
console.log(`🔗 Google Callback: ${baseUrl}/api/auth/callback/google`);
console.log(`🔗 Sign In: ${baseUrl}/api/auth/signin`);

console.log('\n⚙️ Required Google OAuth Settings:');
console.log('In Google Cloud Console, add these Authorized redirect URIs:');
console.log(`- ${baseUrl}/api/auth/callback/google`);

// Test if we can reach the auth endpoints
async function testAuthEndpoints() {
  console.log('\n🧪 Testing Auth Endpoints...');
  
  try {
    const response = await fetch(`${baseUrl}/api/auth/providers`);
    if (response.ok) {
      const providers = await response.json();
      console.log('✅ Auth providers endpoint working');
      console.log('📋 Available providers:', Object.keys(providers));
    } else {
      console.log('❌ Auth providers endpoint failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Cannot reach auth endpoints:', error.message);
  }
}

if (typeof window === 'undefined') {
  // Node.js environment
  testAuthEndpoints();
}