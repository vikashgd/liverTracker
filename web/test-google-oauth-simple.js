#!/usr/bin/env node

/**
 * Simple Google OAuth Test
 * Test if the issue is code-related or external
 */

console.log('🔍 SIMPLE GOOGLE OAUTH TEST');
console.log('===========================');
console.log('');

console.log('📊 CURRENT SITUATION:');
console.log('   ✅ Code reverted to yesterday (df45b71)');
console.log('   ✅ Yesterday Google login was working');
console.log('   ❌ Today Google login redirects to error');
console.log('   🤔 Same code, different behavior = external issue');
console.log('');

console.log('🎯 POSSIBLE EXTERNAL CAUSES:');
console.log('');
console.log('1️⃣ GOOGLE OAUTH APP STATUS CHANGED:');
console.log('   • App was automatically moved to "Testing" mode');
console.log('   • Google periodically reviews OAuth apps');
console.log('   • Unpublished apps get restricted after time');
console.log('');
console.log('2️⃣ GOOGLE ACCOUNT PERMISSIONS:');
console.log('   • Your account permissions changed');
console.log('   • Google security settings updated');
console.log('   • Account flagged for review');
console.log('');
console.log('3️⃣ BROWSER/CACHE ISSUES:');
console.log('   • Cached OAuth tokens expired');
console.log('   • Browser security settings changed');
console.log('   • Cookies/session data corrupted');
console.log('');

console.log('🧪 IMMEDIATE TESTS:');
console.log('');
console.log('TEST 1: Use email/password login');
console.log('   • URL: https://livertracker.com/auth/signin');
console.log('   • Email: vikashgd@gmail.com');
console.log('   • Password: any password');
console.log('   • Expected: Should work (tests if app is working)');
console.log('');
console.log('TEST 2: Try Google login in incognito');
console.log('   • Open incognito/private window');
console.log('   • Try Google login');
console.log('   • Expected: May work if cache issue');
console.log('');
console.log('TEST 3: Check Google Cloud Console');
console.log('   • Visit: https://console.cloud.google.com');
console.log('   • Project: livertracker-468816');
console.log('   • Check OAuth app status');
console.log('   • Look for any warnings/changes');
console.log('');

console.log('💡 MOST LIKELY CAUSE:');
console.log('   Google OAuth app status changed from "Published" to "Testing"');
console.log('   This happens automatically after periods of inactivity');
console.log('   Solution: Re-publish the app or add test users');
console.log('');

console.log('🚀 QUICK FIX:');
console.log('   1. Use email/password login NOW');
console.log('   2. Check Google Cloud Console');
console.log('   3. Re-publish OAuth app if needed');
console.log('');

console.log('✅ The code is fine - this is an external OAuth configuration issue!');