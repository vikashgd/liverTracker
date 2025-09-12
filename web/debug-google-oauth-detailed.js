#!/usr/bin/env node

/**
 * Detailed Google OAuth Debug
 * Let's find the exact issue with your Google OAuth
 */

console.log('🔍 DETAILED GOOGLE OAUTH DEBUG');
console.log('==============================');
console.log('');

console.log('📊 CURRENT CONFIGURATION:');
console.log('');
console.log('🔧 Environment Variables:');
console.log('   GOOGLE_CLIENT_ID: 145819462545-86nc55rg1jbr51t6h921n5fgjev1agjk.apps.googleusercontent.com');
console.log('   GOOGLE_CLIENT_SECRET: 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');
console.log('   NEXTAUTH_URL: https://livertracker.com');
console.log('');

console.log('🎯 EXPECTED REDIRECT URI:');
console.log('   https://livertracker.com/api/auth/callback/google');
console.log('');

console.log('🚨 COMMON ISSUES TO CHECK:');
console.log('');
console.log('1️⃣ REDIRECT URI MISMATCH:');
console.log('   ❌ Wrong: http://livertracker.com/api/auth/callback/google');
console.log('   ❌ Wrong: https://www.livertracker.com/api/auth/callback/google');
console.log('   ✅ Correct: https://livertracker.com/api/auth/callback/google');
console.log('');

console.log('2️⃣ OAUTH APP STATUS:');
console.log('   • Check if app is "Published" or "Testing"');
console.log('   • If Testing: ensure vikashgd@gmail.com is in test users');
console.log('   • If Published: should work for all users');
console.log('');

console.log('3️⃣ DOMAIN VERIFICATION:');
console.log('   • Domain livertracker.com must be verified');
console.log('   • Check Domain verification in Google Console');
console.log('');

console.log('🔧 GOOGLE CLOUD CONSOLE CHECKLIST:');
console.log('');
console.log('Step 1: Go to https://console.cloud.google.com');
console.log('Step 2: Select project: livertracker-468816');
console.log('Step 3: APIs & Services > Credentials');
console.log('Step 4: Click on OAuth 2.0 Client ID');
console.log('Step 5: Check "Authorized redirect URIs"');
console.log('Step 6: Must contain: https://livertracker.com/api/auth/callback/google');
console.log('');

console.log('Step 7: Go to OAuth consent screen');
console.log('Step 8: Check Publishing status');
console.log('Step 9: If Testing - add vikashgd@gmail.com to test users');
console.log('Step 10: If Published - should work immediately');
console.log('');

console.log('🧪 IMMEDIATE TEST:');
console.log('');
console.log('1. Clear all browser data (cookies, cache, etc.)');
console.log('2. Go to: https://livertracker.com/auth/signin');
console.log('3. Click "Continue with Google"');
console.log('4. Check browser network tab for exact error');
console.log('5. Note the exact URL it redirects to');
console.log('');

console.log('📋 MOST LIKELY FIXES:');
console.log('');
console.log('FIX 1: Add correct redirect URI');
console.log('   • https://livertracker.com/api/auth/callback/google');
console.log('');
console.log('FIX 2: Ensure test user is added');
console.log('   • Add vikashgd@gmail.com to test users list');
console.log('');
console.log('FIX 3: Publish the OAuth app');
console.log('   • Click "PUBLISH APP" in OAuth consent screen');
console.log('');

console.log('🚀 Let me know what you see in Google Cloud Console and we\'ll fix this!');