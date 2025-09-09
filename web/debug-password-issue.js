#!/usr/bin/env node

/**
 * Debug script to investigate the password requirement issue
 */

console.log('🔐 Debugging Password Requirement Issue');
console.log('='.repeat(50));

console.log('\n🔍 Potential Causes:');
console.log('1. Password field in DB is empty string "" instead of null');
console.log('2. Share creation modal sending empty password');
console.log('3. API validation logic checking for empty string');
console.log('4. Database schema issue with password field');

console.log('\n🔧 Investigation Steps:');
console.log('1. Check database for latest share link');
console.log('2. Verify password field value (should be null for no password)');
console.log('3. Check API request payload from modal');
console.log('4. Verify validation logic in ShareLinkService');

console.log('\n📊 Expected Database Values:');
console.log('- No password: password = null');
console.log('- With password: password = "$2a$12$..." (hashed)');
console.log('- NOT: password = "" (empty string)');

console.log('\n🛠️  Quick Database Check:');
console.log('Run this in your database console:');
console.log('');
console.log('SELECT id, title, password, "createdAt" FROM "ShareLink" ORDER BY "createdAt" DESC LIMIT 5;');
console.log('');
console.log('Look for:');
console.log('- password column should be NULL for no password');
console.log('- password column should have hash for protected links');

console.log('\n🔍 Browser Debug Steps:');
console.log('1. Open share-management page');
console.log('2. Open dev tools Network tab');
console.log('3. Create a new share without password');
console.log('4. Check the POST request to /api/share-links');
console.log('5. Verify password field is undefined or not present');

console.log('\n⚠️  Common Issues:');
console.log('- Empty string "" being treated as password');
console.log('- Form sending password: "" instead of omitting field');
console.log('- API not filtering out empty passwords');
console.log('- Database storing "" instead of NULL');

console.log('\n🛠️  Potential Fixes:');
console.log('1. Filter out empty passwords in API');
console.log('2. Update modal to not send password field if empty');
console.log('3. Update validation to check for null/undefined only');
console.log('4. Clean existing empty password records');

console.log('\n📋 Next Steps:');
console.log('1. Check database values');
console.log('2. Test share creation with dev tools open');
console.log('3. Verify API request payload');
console.log('4. Apply appropriate fix');