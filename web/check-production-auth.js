#!/usr/bin/env node

async function checkProductionAuth() {
  console.log('🔍 Checking production authentication status...\n');
  
  try {
    // Check if the production site is accessible
    console.log('1. Testing production site accessibility...');
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('https://livertracker.com', {
      method: 'GET',
      timeout: 10000
    });
    
    if (response.ok) {
      console.log('✅ Production site is accessible');
    } else {
      console.log(`⚠️  Production site returned status: ${response.status}`);
    }
    
    // Check auth endpoints
    console.log('2. Testing authentication endpoints...');
    
    const authResponse = await fetch('https://livertracker.com/api/auth/signin', {
      method: 'GET',
      timeout: 10000
    });
    
    if (authResponse.ok) {
      console.log('✅ Auth signin endpoint is working');
    } else {
      console.log(`⚠️  Auth signin endpoint returned: ${authResponse.status}`);
    }
    
    console.log('\n📋 Current environment check:');
    console.log('• NEXTAUTH_URL should be: https://livertracker.com');
    console.log('• Google OAuth should be configured for livertracker.com domain');
    console.log('• Database should be accessible from production');
    
    console.log('\n🔧 If login still fails, try:');
    console.log('1. Clear all cookies for livertracker.com');
    console.log('2. Try incognito/private browsing mode');
    console.log('3. Check browser console for JavaScript errors');
    console.log('4. Verify Google OAuth settings allow livertracker.com');
    
  } catch (error) {
    console.error('❌ Error checking production auth:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 DNS resolution failed - check if livertracker.com is properly configured');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 Connection timeout - the server might be slow to respond');
    }
  }
}

checkProductionAuth();