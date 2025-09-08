#!/usr/bin/env node

/**
 * Start the Next.js app on port 8080 with network access
 */

const { spawn } = require('child_process');
const os = require('os');

console.log('🚀 Starting Medical Sharing System on port 8080...\n');

// Get network interfaces
const interfaces = os.networkInterfaces();
const networkIPs = [];

Object.keys(interfaces).forEach(interfaceName => {
  interfaces[interfaceName].forEach(interface => {
    if (interface.family === 'IPv4' && !interface.internal) {
      networkIPs.push(interface.address);
    }
  });
});

console.log('📡 Network Configuration:');
console.log(`   Local:    http://localhost:8080`);
console.log(`   Local:    http://127.0.0.1:8080`);
networkIPs.forEach(ip => {
  console.log(`   Network:  http://${ip}:8080`);
});
console.log('');

// Set environment variables for network access
process.env.PORT = '8080';
process.env.HOSTNAME = '0.0.0.0';

// Start the Next.js development server
const nextDev = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '8080',
    HOSTNAME: '0.0.0.0'
  }
});

nextDev.on('close', (code) => {
  console.log(`\n🛑 Server stopped with code ${code}`);
});

nextDev.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  nextDev.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  nextDev.kill('SIGTERM');
});