// Test NextAuth configuration
require('dotenv').config();

console.log('Environment Variables:');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set');

// Test the auth configuration
try {
  const { authOptions } = require('./src/lib/auth-config.ts');
  console.log('\nAuth providers configured:', authOptions.providers?.length || 0);
} catch (error) {
  console.log('\nError loading auth config:', error.message);
}