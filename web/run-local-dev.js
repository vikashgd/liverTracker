#!/usr/bin/env node

/**
 * Quick script to start local development server and check the comparison table
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting LiverTracker Local Development Server...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.log('❌ Error: package.json not found. Make sure you\'re in the web directory.');
  process.exit(1);
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies first...');
  const install = spawn('npm', ['install'], { stdio: 'inherit' });
  
  install.on('close', (code) => {
    if (code === 0) {
      startDevServer();
    } else {
      console.log('❌ Failed to install dependencies');
      process.exit(1);
    }
  });
} else {
  startDevServer();
}

function startDevServer() {
  console.log('🔧 Starting Next.js development server...');
  console.log('📍 Your comparison table will be visible at: http://localhost:3000');
  console.log('🎯 Look for the "Why Choose LiverTracker?" section on the homepage\n');
  
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
}

console.log('💡 Tips:');
console.log('   - The comparison table is between Features and Coming Soon sections');
console.log('   - LiverTracker column is highlighted in blue');
console.log('   - Table shows ✓, ⚠️, and ❌ icons for feature support');
console.log('   - Fully responsive design for mobile and desktop');
console.log('   - Press Ctrl+C to stop the server\n');