#!/usr/bin/env node

const { PrismaClient } = require('./src/generated/prisma');

async function diagnoseProfileContamination() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚨 CRITICAL: Diagnosing Profile Data Contamination Issue\n');
    console.log('This is a HIPAA violation and patient safety issue!\n');
    
    // 1. Check all users and their profiles
    console.log('1. Checking all users and their profiles...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (ID: ${user.id}, Created: ${user.createdAt})`);
    });
    console.log('');
    
    // 2. Check patient profiles and their ownership
    console.log('2. Checking patient profiles and ownership...');
    const profiles = await prisma.patientProfile.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    console.log(`Found ${profiles.length} patient profiles:`);
    profiles.forEach((profile, index) => {
      console.log(`  ${index + 1}. Profile for ${profile.user.email}:`);
      console.log(`     - User ID: ${profile.userId}`);
      console.log(`     - Name: ${profile.user.name || 'Not set'}`);
      console.log(`     - DOB: ${profile.dateOfBirth || 'Not set'}`);
      console.log(`     - Gender: ${profile.gender || 'Not set'}`);
      console.log(`     - Updated: ${profile.updatedAt}`);
      console.log(`     - Created: ${profile.createdAt}`);
      console.log('');
    });
    
    // 3. Check for duplicate profiles (should not exist)
    console.log('3. Checking for duplicate profiles...');
    const duplicateCheck = await prisma.patientProfile.groupBy({
      by: ['userId'],
      _count: {
        userId: true
      },
      having: {
        userId: {
          _count: {
            gt: 1
          }
        }
      }
    });
    
    if (duplicateCheck.length > 0) {
      console.log('⚠️  FOUND DUPLICATE PROFILES:');
      duplicateCheck.forEach(dup => {
        console.log(`   User ID ${dup.userId} has ${dup._count.userId} profiles`);
      });
    } else {
      console.log('✅ No duplicate profiles found');
    }
    console.log('');
    
    // 4. Check active sessions
    console.log('4. Checking active sessions...');
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
      },
      orderBy: {
        expires: 'desc'
      }
    });
    
    console.log(`Found ${activeSessions.length} active sessions:`);
    activeSessions.forEach((session, index) => {
      console.log(`  ${index + 1}. ${session.user.email}`);
      console.log(`     - Session Token: ${session.sessionToken.substring(0, 20)}...`);
      console.log(`     - User ID: ${session.userId}`);
      console.log(`     - Expires: ${session.expires}`);
      console.log('');
    });
    
    // 5. Check for session token conflicts
    console.log('5. Checking for session token conflicts...');
    const sessionTokens = activeSessions.map(s => s.sessionToken);
    const uniqueTokens = new Set(sessionTokens);
    
    if (sessionTokens.length !== uniqueTokens.size) {
      console.log('🚨 CRITICAL: Duplicate session tokens found!');
    } else {
      console.log('✅ All session tokens are unique');
    }
    
    // 6. Identify potential causes
    console.log('\n🔍 POTENTIAL CAUSES OF PROFILE CONTAMINATION:');
    console.log('1. Shared Prisma client instances between requests');
    console.log('2. Session token conflicts or sharing');
    console.log('3. Incorrect user ID retrieval in API routes');
    console.log('4. Cookie domain issues causing session mixing');
    console.log('5. Database connection pooling issues');
    console.log('6. Race conditions in profile updates');
    
    // 7. Check the most recent profile updates
    console.log('\n7. Checking recent profile updates (last 10):');
    const recentUpdates = await prisma.patientProfile.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });
    
    recentUpdates.forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile.user.email} - Updated: ${profile.updatedAt}`);
      console.log(`     Gender: ${profile.gender}, DOB: ${profile.dateOfBirth}`);
    });
    
    console.log('\n🚨 IMMEDIATE ACTIONS REQUIRED:');
    console.log('1. Isolate each API request with fresh Prisma client');
    console.log('2. Add extensive logging to track user ID flow');
    console.log('3. Implement session validation on every request');
    console.log('4. Add user ID verification before data access');
    console.log('5. Test with multiple concurrent users');
    
  } catch (error) {
    console.error('❌ Error diagnosing profile contamination:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseProfileContamination();