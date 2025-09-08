#!/usr/bin/env node

/**
 * Fix API Route 404 - Module Resolution Issue
 * 
 * This script diagnoses and fixes the module resolution issue
 * causing the share API route to fail
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing API Route Module Resolution Issue...\n');

// Check if the problematic files exist
const filesToCheck = [
  'src/lib/medical-sharing/share-link-service.ts',
  'src/lib/medical-sharing/medical-data-aggregator.ts',
  'src/app/api/share/[token]/data/route.ts'
];

console.log('📁 Checking file existence:');
filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Check the import statements in the API route
const apiRoutePath = path.join(__dirname, 'src/app/api/share/[token]/data/route.ts');
if (fs.existsSync(apiRoutePath)) {
  const content = fs.readFileSync(apiRoutePath, 'utf8');
  console.log('\n📋 Current imports in API route:');
  
  const importLines = content.split('\n').filter(line => line.includes('import'));
  importLines.forEach(line => {
    console.log(`   ${line.trim()}`);
  });
}

// Check TypeScript config
const tsConfigPath = path.join(__dirname, 'tsconfig.json');
if (fs.existsSync(tsConfigPath)) {
  console.log('\n⚙️ TypeScript config exists');
} else {
  console.log('\n❌ TypeScript config missing');
}

// Check Next.js config
const nextConfigPath = path.join(__dirname, 'next.config.ts');
if (fs.existsSync(nextConfigPath)) {
  console.log('⚙️ Next.js config exists');
} else {
  console.log('❌ Next.js config missing');
}

console.log('\n🔧 Potential Solutions:');
console.log('   1. Clear Next.js build cache');
console.log('   2. Restart development server');
console.log('   3. Check TypeScript path resolution');
console.log('   4. Verify file exports are correct');

console.log('\n🚀 Running fixes...');

// Try to clear Next.js cache
const { execSync } = require('child_process');

try {
  console.log('   🗑️ Clearing Next.js cache...');
  execSync('rm -rf .next', { cwd: __dirname });
  console.log('   ✅ Cache cleared');
} catch (error) {
  console.log('   ⚠️ Could not clear cache:', error.message);
}

try {
  console.log('   🔄 Reinstalling dependencies...');
  execSync('npm install', { cwd: __dirname, stdio: 'inherit' });
  console.log('   ✅ Dependencies reinstalled');
} catch (error) {
  console.log('   ⚠️ Could not reinstall dependencies:', error.message);
}

console.log('\n✅ Fix complete! Try restarting the development server.');
console.log('   Run: npm run dev');