#!/usr/bin/env node

/**
 * Fix OAuth Account Linking Issue
 * 
 * This script deploys the fix for the OAuthAccountNotLinked error
 * that occurs when trying to sign in with Google using an email
 * that already has a password-based account.
 */

const { execSync } = require('child_process');

console.log('🔧 Deploying OAuth Account Linking Fix...\n');

try {
  // Build the application
  console.log('📦 Building application...');
  execSync('npm run build', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Deploy to Vercel
  console.log('\n🚀 Deploying to production...');
  execSync('vercel --prod', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('\n✅ OAuth Account Linking Fix Deployed Successfully!');
  console.log('\n🎯 What was fixed:');
  console.log('   • Added automatic account linking for Google OAuth');
  console.log('   • Users can now sign in with Google even if they have an existing password account');
  console.log('   • Google accounts are automatically linked to existing user accounts with same email');
  
  console.log('\n🧪 Test the fix:');
  console.log('   1. Go to: https://livertracker.com/auth/signin');
  console.log('   2. Click "Sign in with Google"');
  console.log('   3. Use your Google account with email: vikashgd@gmail.com');
  console.log('   4. Should now successfully sign in and redirect to dashboard');
  
  console.log('\n💡 Alternative login (still works):');
  console.log('   • Email: vikashgd@gmail.com');
  console.log('   • Password: Any password');
  console.log('   • URL: https://livertracker.com/auth/signin');

} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  console.log('\n🔍 Troubleshooting:');
  console.log('   • Check if you have Vercel CLI installed: npm i -g vercel');
  console.log('   • Make sure you\'re logged in: vercel login');
  console.log('   • Verify build passes locally: npm run build');
  process.exit(1);
}