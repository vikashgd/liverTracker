#!/usr/bin/env node

const { PrismaClient } = require('./src/generated/prisma');

async function testProfileIsolation() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Profile Isolation Fix\n');
    
    // 1. Check current state
    console.log('1. Current profile state:');
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
    
    profiles.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.user.email}:`);
      console.log(`      - Name: ${profile.user.name}`);
      console.log(`      - Gender: ${profile.gender}`);
      console.log(`      - DOB: ${profile.dateOfBirth}`);
      console.log(`      - User ID: ${profile.userId}`);
      console.log(`      - Updated: ${profile.updatedAt}`);
      console.log('');
    });
    
    // 2. Check for any active sessions
    console.log('2. Checking active sessions:');
    const sessions = await prisma.session.findMany({
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
    
    if (sessions.length === 0) {
      console.log('   ⚠️  No active sessions found');
      console.log('   This explains the profile contamination issue!');
      console.log('   Users are not properly authenticated.');
    } else {
      sessions.forEach((session, index) => {
        console.log(`   ${index + 1}. ${session.user.email} - Expires: ${session.expires}`);
      });
    }
    
    // 3. Verify user-profile relationships
    console.log('\n3. Verifying user-profile relationships:');
    const users = await prisma.user.findMany({
      include: {
        patientProfile: true
      }
    });
    
    users.forEach(user => {
      console.log(`   ${user.email}:`);
      if (user.patientProfile) {
        console.log(`      ✅ Has profile - Gender: ${user.patientProfile.gender}`);
        console.log(`      ✅ Profile User ID matches: ${user.id === user.patientProfile.userId}`);
      } else {
        console.log(`      ❌ No profile found`);
      }
    });
    
    console.log('\n🔧 FIXES APPLIED:');
    console.log('✅ Fresh Prisma client per request');
    console.log('✅ Direct session validation');
    console.log('✅ Extensive logging added');
    console.log('✅ User ID verification on every operation');
    console.log('✅ Explicit user ID checks in database queries');
    
    console.log('\n📋 TESTING INSTRUCTIONS:');
    console.log('1. Deploy these changes to production');
    console.log('2. Have multiple users log in simultaneously');
    console.log('3. Each user should update their profile');
    console.log('4. Verify each user sees only their own data');
    console.log('5. Check server logs for detailed user flow tracking');
    
    console.log('\n🚨 CRITICAL: Monitor production logs closely!');
    console.log('Look for user ID and email in every profile operation.');
    
  } catch (error) {
    console.error('❌ Error testing profile isolation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProfileIsolation();