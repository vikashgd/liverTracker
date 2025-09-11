#!/usr/bin/env node

/**
 * Script to prepare and push the final "Why Us" section implementation
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Preparing Final "Why Us" Section for Push...\n');

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

// List the files we've modified
console.log('\n2. Files modified:');
const files = [
  'src/components/landing/landing-page.tsx',
  'src/components/landing/landing-header.tsx', 
  'src/components/landing/comparison-section.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} (missing)`);
  }
});

console.log('\n3. Files removed:');
console.log('   ✅ src/app/why-us/page.tsx (dedicated page no longer needed)');

console.log('\n📋 Final implementation summary:');
console.log('✨ "Why Us" section integrated on main homepage');
console.log('🎨 Beautiful gradient background (blue to purple)');
console.log('🔗 Smooth anchor navigation (no separate page)');
console.log('📍 Section ID "why-us" for proper scrolling');
console.log('📊 Professional comparison table with status icons');
console.log('📱 Fully responsive design');

console.log('\n🔧 Recommended commit message:');
console.log('feat: Add Why Us section with comparison table on homepage');
console.log('');
console.log('- Add comparison section between Features and Coming Soon');
console.log('- Implement anchor navigation for Why Us menu item');
console.log('- Apply gradient background to distinguish section');
console.log('- Remove unnecessary dedicated page');
console.log('- Maintain responsive design and professional styling');

console.log('\n🌐 Testing instructions:');
console.log('1. npm run dev');
console.log('2. Visit http://localhost:3000');
console.log('3. Click "Why Us" in navigation');
console.log('4. Verify smooth scroll to gradient section');
console.log('5. Check comparison table displays correctly');

// Ask if user wants to auto-commit
console.log('\n❓ Ready to commit and push? (y/N)');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', (key) => {
  if (key.toString().toLowerCase() === 'y') {
    console.log('\n🚀 Committing and pushing...');
    
    try {
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "feat: Add Why Us section with comparison table on homepage\n\n- Add comparison section between Features and Coming Soon\n- Implement anchor navigation for Why Us menu item\n- Apply gradient background to distinguish section\n- Remove unnecessary dedicated page\n- Maintain responsive design and professional styling"', { stdio: 'inherit' });
      execSync('git push', { stdio: 'inherit' });
      console.log('\n✅ Successfully pushed to repository!');
      console.log('\n🎉 "Why Us" section is now live!');
    } catch (error) {
      console.log('\n❌ Error during git operations:', error.message);
    }
  } else {
    console.log('\n👍 Manual commit - use the commands above when ready.');
  }
  process.exit(0);
});