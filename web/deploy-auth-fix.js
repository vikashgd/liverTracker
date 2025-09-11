#!/usr/bin/env node

const { execSync } = require('child_process');

function deployAuthFix() {
  console.log('🚀 Deploying authentication fixes for online production...\n');
  
  try {
    // 1. Check git status
    console.log('1. Checking git status...');
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (gitStatus.trim()) {
      console.log('📝 Found changes to commit:');
      console.log(gitStatus);
      
      // 2. Add and commit changes
      console.log('2. Committing authentication fixes...');
      execSync('git add .');
      execSync('git commit -m "fix: resolve online authentication and session issues"');
      console.log('✅ Changes committed');
    } else {
      console.log('✅ No changes to commit');
    }
    
    // 3. Push to production
    console.log('3. Pushing to production...');
    execSync('git push origin main');
    console.log('✅ Pushed to production');
    
    console.log('\n🎉 Authentication fixes deployed!');
    console.log('\nWhat was fixed:');
    console.log('• Simplified cookie configuration for production');
    console.log('• Fixed domain settings for livertracker.com');
    console.log('• Added proper logout API route');
    console.log('• Disabled debug mode for production');
    
    console.log('\nNext steps:');
    console.log('1. Wait 2-3 minutes for deployment to complete');
    console.log('2. Clear your browser cookies for livertracker.com');
    console.log('3. Try logging in again with Google OAuth');
    console.log('4. If still having issues, check the browser console for errors');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    
    if (error.message.includes('nothing to commit')) {
      console.log('✅ No changes to deploy - authentication config is already up to date');
    }
  }
}

deployAuthFix();