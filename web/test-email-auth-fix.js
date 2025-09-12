#!/usr/bin/env node

/**
 * Test Email Authentication Fix
 */

const { PrismaClient } = require('./src/generated/prisma');

async function testEmailAuthFix() {
  console.log('🧪 TESTING EMAIL AUTHENTICATION FIX');
  console.log('='.repeat(50));

  const prisma = new PrismaClient();

  try {
    // Check for existing users
    const users = await prisma.user.findMany({
      take: 5,
      include: {
        accounts: true,
        sessions: true
      }
    });

    console.log(`Found ${users.length} users in database:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
      console.log(`   Accounts: ${user.accounts.length}`);
      console.log(`   Sessions: ${user.sessions.length}`);
      console.log('');
    });

    console.log('\n📋 TESTING STEPS:');
    console.log('1. Go to https://livertracker.com/auth/signin');
    console.log('2. Use email authentication with existing user email');
    console.log('3. Check browser console for session debug logs');
    console.log('4. Verify dashboard shows authenticated state');
    console.log('5. Check header shows user menu instead of sign-in button');

    console.log('\n🔍 WHAT TO LOOK FOR:');
    console.log('✅ Session debug shows status: "authenticated"');
    console.log('✅ Session debug shows valid user ID');
    console.log('✅ Dashboard loads without showing sign-in button');
    console.log('✅ Header shows user dropdown menu');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailAuthFix().catch(console.error);