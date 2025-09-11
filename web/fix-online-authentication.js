#!/usr/bin/env node

const { PrismaClient } = require('./src/generated/prisma');

async function fixOnlineAuthentication() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Fixing online authentication issues...\n');
    
    // 1. Check database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');
    
    // 2. Check current users and sessions
    console.log('2. Checking current authentication state...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${users.length} users in database`);
    
    // 3. Clean up expired sessions
    console.log('3. Cleaning up expired sessions...');
    const expiredSessions = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    });
    console.log(`Removed ${expiredSessions.count} expired sessions`);
    
    // 4. Check for active sessions
    const activeSessions = await prisma.session.findMany({
      where: {
        expires: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });
    
    console.log(`Found ${activeSessions.length} active sessions`);
    
    // 5. Check OAuth accounts
    const oauthAccounts = await prisma.account.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });
    
    console.log(`Found ${oauthAccounts.length} OAuth accounts`);
    
    // 6. Create a test user if none exist (for testing)
    if (users.length === 0) {
      console.log('6. Creating test user for authentication testing...');
      const testUser = await prisma.user.create({
        data: {
          email: 'test@livertracker.com',
          name: 'Test User',
          emailVerified: new Date()
        }
      });
      console.log(`Created test user: ${testUser.email}`);
    }
    
    console.log('\n✅ Authentication fix completed!');
    console.log('\nNext steps:');
    console.log('1. Deploy this to production');
    console.log('2. Try logging in with Google OAuth');
    console.log('3. If issues persist, check browser cookies and clear them');
    
  } catch (error) {
    console.error('❌ Error fixing authentication:', error);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Database connection issue detected.');
      console.log('This might be because the Neon database is paused.');
      console.log('Try accessing your app first to wake up the database.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixOnlineAuthentication();