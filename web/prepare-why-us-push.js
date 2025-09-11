#!/usr/bin/env node

/**
 * Script to prepare and push the "Why Us" page implementation
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Preparing "Why Us" Page Implementation for Push...\n');

// Check git status
console.log('1. Checking git status...');
try {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    console.log('✅ Changes detected:');
    console.log(status);
  } else {
    console.log('⚠️  No changes detected');
  }
} catch (error) {
  console.log('❌ Git status check failed');
}

// List the files we've modified/created
console.log('\n2. Files modified/created:');
const files = [
  'src/app/why-us/page.tsx',
  'src/components/landing/landing-header.tsx',
  'src/components/landing/landing-page.tsx',
  'src/components/landing/comparison-section.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} (missing)`);
  }
});

console.log('\n3. Ready to commit and push!');
console.log('\n📋 Commit message suggestion:');
console.log('feat: Add dedicated "Why Us" page with comparison table');
console.log('');
console.log('- Create new /why-us route with gradient background');
console.log('- Move comparison table to dedicated page');
console.log('- Add "Why Us" menu item between Features and Contact');
console.log('- Enhance comparison section with benefits icons');
console.log('- Remove comparison from main landing page');

console.log('\n🔧 Commands to run:');
console.log('git add .');
console.log('git commit -m "feat: Add dedicated Why Us page with comparison table"');
console.log('git push');

console.log('\n🎯 What this adds:');
console.log('✨ Beautiful dedicated "Why Us" page at /why-us');
console.log('🎨 Gradient background (blue to purple)');
console.log('📊 Professional comparison table');
console.log('🔗 Updated navigation menu');
console.log('💡 Additional benefits section with icons');
console.log('📱 Fully responsive design');

// Ask if user wants to auto-commit
console.log('\n❓ Would you like to auto-commit and push? (y/N)');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', (key) => {
  if (key.toString().toLowerCase() === 'y') {
    console.log('\n🚀 Auto-committing and pushing...');
    
    try {
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "feat: Add dedicated Why Us page with comparison table\n\n- Create new /why-us route with gradient background\n- Move comparison table to dedicated page\n- Add Why Us menu item between Features and Contact\n- Enhance comparison section with benefits icons\n- Remove comparison from main landing page"', { stdio: 'inherit' });
      execSync('git push', { stdio: 'inherit' });
      console.log('\n✅ Successfully pushed to repository!');
    } catch (error) {
      console.log('\n❌ Error during git operations:', error.message);
    }
  } else {
    console.log('\n👍 Manual commit - use the commands above when ready.');
  }
  process.exit(0);
});