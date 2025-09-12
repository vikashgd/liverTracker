#!/usr/bin/env node

/**
 * Diagnose Email Authentication Session Issue
 * 
 * Problem: Email auth redirects to dashboard but shows sign-in button
 * Google OAuth works fine, email auth session not recognized
 */

const { PrismaClient } = require('@prisma/client');

async function diagnoseEmailAuthSession() {
  console.log('🔍 DIAGNOSING EMAIL AUTHENTICATION SESSION ISSUE');
  console.log('='.repeat(60));

  const prisma = new PrismaClient();

  try {
    // 1. Check NextAuth configuration
    console.log('\n1. 📋 CHECKING NEXTAUTH CONFIGURATION');
    console.log('Environment variables:');
    console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'NOT SET');
    console.log('- NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET');
    console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

    // 2. Check recent user sessions
    console.log('\n2. 👥 CHECKING RECENT USER SESSIONS');
    const recentSessions = await prisma.session.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    console.log(`Found ${recentSessions.length} recent sessions:`);
    recentSessions.forEach((session, index) => {
      console.log(`${index + 1}. User: ${session.user.email}`);
      console.log(`   Session ID: ${session.sessionToken.substring(0, 20)}...`);
      console.log(`   Expires: ${session.expires}`);
      console.log(`   Created: ${session.createdAt}`);
      console.log('');
    });

    // 3. Check accounts table for email vs OAuth
    console.log('\n3. 🔐 CHECKING ACCOUNT TYPES');
    const accounts = await prisma.account.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    const emailAccounts = accounts.filter(acc => acc.type === 'credentials');
    const oauthAccounts = accounts.filter(acc => acc.type === 'oauth');

    console.log(`Email/Credentials accounts: ${emailAccounts.length}`);
    emailAccounts.forEach((acc, index) => {
      console.log(`${index + 1}. ${acc.user.email} (ID: ${acc.user.id})`);
    });

    console.log(`\nOAuth accounts: ${oauthAccounts.length}`);
    oauthAccounts.forEach((acc, index) => {
      console.log(`${index + 1}. ${acc.user.email} - ${acc.provider} (ID: ${acc.user.id})`);
    });

    // 4. Check for session token issues
    console.log('\n4. 🎫 CHECKING SESSION TOKEN PATTERNS');
    const activeSessions = await prisma.session.findMany({
      where: {
        expires: {
          gt: new Date()
        }
      },
      include: {
        user: {
          include: {
            accounts: true
          }
        }
      }
    });

    console.log(`Active sessions: ${activeSessions.length}`);
    activeSessions.forEach((session, index) => {
      const accountTypes = session.user.accounts.map(acc => acc.type).join(', ');
      console.log(`${index + 1}. ${session.user.email}`);
      console.log(`   Account types: ${accountTypes}`);
      console.log(`   Session expires: ${session.expires}`);
      console.log('');
    });

    // 5. Check for duplicate users
    console.log('\n5. 👤 CHECKING FOR DUPLICATE USERS');
    const users = await prisma.user.findMany({
      include: {
        accounts: true,
        sessions: true
      }
    });

    const emailGroups = {};
    users.forEach(user => {
      if (user.email) {
        if (!emailGroups[user.email]) {
          emailGroups[user.email] = [];
        }
        emailGroups[user.email].push(user);
      }
    });

    const duplicates = Object.entries(emailGroups).filter(([email, users]) => users.length > 1);
    if (duplicates.length > 0) {
      console.log('⚠️  FOUND DUPLICATE USERS:');
      duplicates.forEach(([email, users]) => {
        console.log(`Email: ${email}`);
        users.forEach(user => {
          console.log(`  - ID: ${user.id}, Accounts: ${user.accounts.length}, Sessions: ${user.sessions.length}`);
        });
      });
    } else {
      console.log('✅ No duplicate users found');
    }

    // 6. Recommendations
    console.log('\n6. 💡 RECOMMENDATIONS');
    console.log('Based on the analysis:');
    
    if (emailAccounts.length === 0) {
      console.log('❌ No email/credentials accounts found - email auth may not be working');
    } else {
      console.log('✅ Email accounts exist');
    }

    if (activeSessions.length === 0) {
      console.log('❌ No active sessions - session creation may be failing');
    } else {
      console.log('✅ Active sessions exist');
    }

    console.log('\nNext steps:');
    console.log('1. Check NextAuth session callback configuration');
    console.log('2. Verify session token generation for email auth');
    console.log('3. Check dashboard session validation logic');
    console.log('4. Compare OAuth vs email auth session creation');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run diagnosis
diagnoseEmailAuthSession().catch(console.error);