#!/usr/bin/env node

const { PrismaClient } = require('./src/generated/prisma');

async function debugAuthState() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Debugging current authentication state...\n');
    
    // Check database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');
    
    // Check users table
    console.log('2. Checking users in database...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true
      },
      take: 5
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id}, Created: ${user.createdAt})`);
    });
    console.log('');
    
    // Check accounts table (OAuth connections)
    console.log('3. Checking OAuth accounts...');
    const accounts = await prisma.account.findMany({
      select: {
        provider: true,
        providerAccountId: true,
        userId: true,
        user: {
          select: {
            email: true
          }
        }
      },
      take: 5
    });
    
    console.log(`Found ${accounts.length} OAuth accounts:`);
    accounts.forEach(account => {
      console.log(`  - ${account.provider} for ${account.user.email} (User ID: ${account.userId})`);
    });
    console.log('');
    
    // Check sessions table
    console.log('4. Checking active sessions...');
    const sessions = await prisma.session.findMany({
      where: {
        expires: {
          gt: new Date()
        }
      },
      select: {
        sessionToken: true,
        expires: true,
        userId: true,
        user: {
          select: {
            email: true
          }
        }
      },
      take: 5
    });
    
    console.log(`Found ${sessions.length} active sessions:`);
    sessions.forEach(session => {
      console.log(`  - ${session.user.email} (expires: ${session.expires})`);
    });
    
    if (sessions.length === 0) {
      console.log('⚠️  No active sessions found - this might explain login issues');
    }
    
  } catch (error) {
    console.error('❌ Error debugging auth state:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuthState();