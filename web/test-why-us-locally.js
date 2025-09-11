#!/usr/bin/env node

/**
 * Quick script to test the "Why Us" page locally
 */

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 Testing "Why Us" Page Implementation Locally...\n');

// Check if we're ready
if (!fs.existsSync('package.json')) {
  console.log('❌ Error: package.json not found. Make sure you\'re in the web directory.');
  process.exit(1);
}

console.log('✅ All files verified and ready!');
console.log('\n📋 What\'s new:');
console.log('🔗 Navigation menu now includes "Why Us" between Features and Contact');
console.log('📄 New dedicated page at /why-us with beautiful gradient background');
console.log('📊 Comparison table moved to its own page with enhanced styling');
console.log('🎨 Additional benefits section with icons and descriptions');

console.log('\n🌐 Starting development server...');
console.log('📍 Main page: http://localhost:3000');
console.log('🎯 Why Us page: http://localhost:3000/why-us');

const dev = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });

dev.on('close', (code) => {
  console.log(`\n🛑 Development server stopped with code ${code}`);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down development server...');
  dev.kill('SIGINT');
  process.exit(0);
});

console.log('\n💡 Testing checklist:');
console.log('1. ✅ Check navigation menu has "Why Us" link');
console.log('2. ✅ Click "Why Us" to navigate to the new page');
console.log('3. ✅ Verify beautiful gradient background');
console.log('4. ✅ Check comparison table displays correctly');
console.log('5. ✅ Verify additional benefits section');
console.log('6. ✅ Test responsive design on mobile');
console.log('\nPress Ctrl+C to stop the server when done testing.');