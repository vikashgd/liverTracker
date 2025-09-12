#!/usr/bin/env node

/**
 * Deploy Profile Session Integration
 * 
 * This script deploys the comprehensive profile integration system
 * that automatically detects user sessions and integrates profile data
 * with medical scoring calculations.
 */

const { execSync } = require('child_process');

console.log('🔗 Deploying Profile Session Integration...\n');

try {
  // Build the application
  console.log('📦 Building application with profile integration...');
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

  console.log('\n✅ Profile Session Integration Deployed Successfully!');
  
  console.log('\n🎯 What was deployed:');
  console.log('   ✅ Profile Service - Centralized profile management');
  console.log('   ✅ Profile Hooks - React hooks for profile data');
  console.log('   ✅ Enhanced Profile Page - Session-aware profile display');
  console.log('   ✅ Session Info Component - Real-time session/profile status');
  console.log('   ✅ Integrated MELD Calculator - Profile-aware calculations');
  
  console.log('\n🧪 Test the integration:');
  console.log('   1. Profile Page: https://livertracker.com/profile');
  console.log('   2. Check session detection and profile status');
  console.log('   3. Verify profile completion indicators');
  console.log('   4. Test MELD calculator with profile integration');
  
  console.log('\n🔍 Expected behavior:');
  console.log('   • Automatic detection of logged-in user');
  console.log('   • Profile completion status display');
  console.log('   • Medical scoring integration readiness');
  console.log('   • Real-time profile data across features');
  
  console.log('\n📊 Integration features:');
  console.log('   • Session-based profile detection');
  console.log('   • MELD calculator uses profile dialysis status');
  console.log('   • Automatic unit conversions from profile');
  console.log('   • Profile completion tracking');
  
  console.log('\n🎉 Profile integration is now LIVE in production!');
  console.log('   Users will see their session info and profile status automatically.');

} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  console.log('\n🔍 Troubleshooting:');
  console.log('   • Check if build passes locally: npm run build');
  console.log('   • Verify all new files are committed to git');
  console.log('   • Ensure Vercel CLI is properly configured');
  process.exit(1);
}