#!/usr/bin/env node

/**
 * Fix for PDF.js worker 500 error during upload
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing PDF.js Worker 500 Error...\n');

// Check if pdfjs-dist is installed
console.log('1. Checking pdfjs-dist installation...');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const hasPdfjsDist = packageJson.dependencies?.['pdfjs-dist'] || packageJson.devDependencies?.['pdfjs-dist'];
  
  if (hasPdfjsDist) {
    console.log('✅ pdfjs-dist is installed');
  } else {
    console.log('❌ pdfjs-dist is NOT installed');
    console.log('   This is causing the 500 error in /api/pdfjs/worker');
  }
} else {
  console.log('❌ package.json not found');
}

// Check the worker route
console.log('\n2. Analyzing worker route...');
const workerRoutePath = path.join(__dirname, 'src/app/api/pdfjs/worker/route.ts');
if (fs.existsSync(workerRoutePath)) {
  console.log('✅ Worker route exists');
  const routeContent = fs.readFileSync(workerRoutePath, 'utf8');
  
  const checks = [
    { test: routeContent.includes('pdfjs-dist'), name: 'References pdfjs-dist package' },
    { test: routeContent.includes('require.resolve'), name: 'Uses require.resolve' },
    { test: routeContent.includes('pdf.worker'), name: 'Looks for worker files' },
    { test: routeContent.includes('worker_not_found'), name: 'Has error handling' }
  ];
  
  checks.forEach(check => {
    console.log(`   ${check.test ? '✅' : '❌'} ${check.name}`);
  });
} else {
  console.log('❌ Worker route not found');
}

console.log('\n3. Possible solutions:');
console.log('   Option 1: Install pdfjs-dist package');
console.log('   Option 2: Use CDN-based worker (recommended)');
console.log('   Option 3: Disable PDF preview temporarily');

console.log('\n🎯 Recommended fix:');
console.log('   Replace the worker route with a CDN redirect');
console.log('   This avoids bundling large PDF.js files');

console.log('\n💡 The error occurs because:');
console.log('   - Upload form tries to load PDF.js worker');
console.log('   - Worker route expects pdfjs-dist package');
console.log('   - Package is not installed');
console.log('   - Route returns 500 error');
console.log('   - PDF preview fails in upload form');

console.log('\n🚀 Ready to implement fix...');