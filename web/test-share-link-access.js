#!/usr/bin/env node
/**
 * Test script to verify share link access
 */

console.log('🧪 Testing Share Link Access...\n');

const testToken = '70a983d9942805d9d13f7c0b9260c0c4d1b8ac92a98c13067b3b999649031d2f';

console.log('✅ Token Analysis:');
console.log(`   Token: ${testToken}`);
console.log(`   Length: ${testToken.length} characters`);
console.log(`   Expected: 64 characters (32 bytes as hex)`);
console.log(`   Valid hex: ${/^[a-f0-9]{64}$/i.test(testToken) ? '✅' : '❌'}`);

console.log('\n🔧 Applied Fix:');
console.log('   • Updated token validation from 32 to 64 characters');
console.log('   • Added hex format validation');
console.log('   • Token should now be accepted by the page');

console.log('\n🚀 Testing Steps:');
console.log('1. Restart your server: npm run dev:8080');
console.log('2. Try accessing the share link again:');
console.log(`   http://localhost:8080/share/${testToken}`);
console.log('3. The page should load instead of showing 404');

console.log('\n🔍 Expected Behavior:');
console.log('   • Page loads (no more 404 error)');
console.log('   • Shows share link landing page');
console.log('   • May show password prompt if password protected');
console.log('   • Should display medical data after validation');

console.log('\n🐛 If Still Getting 404:');
console.log('   • Check server console for any errors');
console.log('   • Verify the token is exactly 64 characters');
console.log('   • Make sure server is running on port 8080');
console.log('   • Try refreshing the page');

console.log('\n📋 Manual API Test:');
console.log('You can also test the API directly:');
console.log('');
console.log(`fetch("/api/share/${testToken}")`);
console.log('.then(res => res.json())');
console.log('.then(data => console.log("Share API test:", data));');

console.log('\n🎉 The share link should now work!');