#!/usr/bin/env node

/**
 * Script to fix the Next.js build manifest error
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Next.js Build Manifest Error...\n');

console.log('This error occurs when Next.js build cache is corrupted or outdated.');
console.log('We need to clean the build cache and rebuild.\n');

// Step 1: Remove .next directory
console.log('1. Removing .next build directory...');
const nextDir = path.join(__dirname, '.next');
if (fs.existsSync(nextDir)) {
  try {
    execSync('rm -rf .next', { stdio: 'inherit' });
    console.log('✅ .next directory removed');
  } catch (error) {
    console.log('❌ Failed to remove .next directory:', error.message);
  }
} else {
  console.log('✅ .next directory already clean');
}

// Step 2: Clear npm cache (optional but helpful)
console.log('\n2. Clearing npm cache...');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✅ npm cache cleared');
} catch (error) {
  console.log('⚠️  npm cache clean failed (not critical)');
}

// Step 3: Remove node_modules/.cache if it exists
console.log('\n3. Clearing Next.js cache...');
const cacheDir = path.join(__dirname, 'node_modules', '.cache');
if (fs.existsSync(cacheDir)) {
  try {
    execSync('rm -rf node_modules/.cache', { stdio: 'inherit' });
    console.log('✅ Next.js cache cleared');
  } catch (error) {
    console.log('⚠️  Cache clear failed (not critical)');
  }
} else {
  console.log('✅ No cache directory found');
}

// Step 4: Reinstall dependencies (if needed)
console.log('\n4. Checking dependencies...');
if (!fs.existsSync('node_modules')) {
  console.log('Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.log('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed');
}

console.log('\n' + '='.repeat(50));
console.log('🎉 Build cache cleaned successfully!');

console.log('\n🚀 Now try running your development server:');
console.log('   npm run dev');

console.log('\n🔍 If you still get errors, try:');
console.log('   1. Restart your terminal/IDE');
console.log('   2. Check for any TypeScript errors in your code');
console.log('   3. Make sure all imports are correct');

console.log('\n💡 Common causes of this error:');
console.log('   - Stale build cache after code changes');
console.log('   - Corrupted .next directory');
console.log('   - Missing or moved files that were previously built');
console.log('   - TypeScript compilation errors');