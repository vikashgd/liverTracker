// Debug OAuth configuration
require('dotenv').config();

console.log('🔍 OAuth Configuration Debug\n');

console.log('Environment Variables:');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set ✅' : 'Missing ❌');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set ✅' : 'Missing ❌');

console.log('\n📋 Expected Google OAuth Configuration:');
console.log('Redirect URI should be:', `${process.env.NEXTAUTH_URL}/api/auth/callback/google`);

console.log('\n🔧 Troubleshooting AccessDenied Error:');
console.log('1. Check Google Cloud Console OAuth 2.0 Client ID settings');
console.log('2. Verify Authorized redirect URIs includes:', `${process.env.NEXTAUTH_URL}/api/auth/callback/google`);
console.log('3. Check OAuth consent screen status:');
console.log('   - If "Testing": Add vikashgd@gmail.com to test users');
console.log('   - If "In production": Should work for any Gmail user');
console.log('4. Verify the Google Client ID and Secret are correct');

console.log('\n🌐 Test URLs:');
console.log('Sign in page:', `${process.env.NEXTAUTH_URL}/auth/signin`);
console.log('OAuth providers:', `${process.env.NEXTAUTH_URL}/api/auth/providers`);
console.log('Google OAuth URL:', `${process.env.NEXTAUTH_URL}/api/auth/signin/google`);