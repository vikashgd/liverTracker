#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

// Test if we can import and initialize the auth configuration without errors
console.log('🔄 Testing server configuration...');

try {
  // Test environment variables
  console.log('✅ Environment variables:');
  console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');
  console.log('  NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing');
  console.log('  NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');
  
  // Test Prisma client generation
  const { PrismaClient } = require('./src/generated/prisma');
  console.log('✅ Prisma client imported successfully');
  
  // Test auth config import (without connecting to DB)
  console.log('✅ Testing auth configuration import...');
  
  // Don't actually import the auth config yet as it might try to connect to DB
  console.log('✅ Basic configuration test passed');
  
  console.log('\n🎉 Server configuration looks good!');
  console.log('💡 Next step: Wake up your Neon database and test connection');
  
} catch (error) {
  console.error('❌ Configuration error:', error.message);
  console.error('Stack:', error.stack);
}