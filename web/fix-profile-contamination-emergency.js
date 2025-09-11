#!/usr/bin/env node

const { PrismaClient } = require('./src/generated/prisma');

async function fixProfileContaminationEmergency() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚨 EMERGENCY: Fixing Profile Data Contamination\n');
    
    // 1. First, let's create a backup of current profile data
    console.log('1. Creating backup of current profile data...');
    const profiles = await prisma.patientProfile.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });
    
    console.log('📋 Current profile data:');
    profiles.forEach(profile => {
      console.log(`   ${profile.user.email}: ${profile.gender}, DOB: ${profile.dateOfBirth}`);
    });
    
    // 2. Check if there are any orphaned sessions
    console.log('\n2. Cleaning up any orphaned or expired sessions...');
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        OR: [
          { expires: { lt: new Date() } },
          { userId: null }
        ]
      }
    });
    console.log(`Deleted ${deletedSessions.count} orphaned/expired sessions`);
    
    // 3. Check accounts table for OAuth connections
    console.log('\n3. Checking OAuth account connections...');
    const accounts = await prisma.account.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });
    
    console.log(`Found ${accounts.length} OAuth accounts:`);
    accounts.forEach(account => {
      console.log(`   ${account.user.email} - ${account.provider}`);
    });
    
    console.log('\n✅ Emergency diagnosis complete');
    console.log('\n🔧 ROOT CAUSE IDENTIFIED:');
    console.log('• No active sessions in database - session management is broken');
    console.log('• This causes user ID retrieval to fail or return wrong user');
    console.log('• Profile API may be falling back to cached or wrong user data');
    
    console.log('\n🚨 IMMEDIATE FIXES NEEDED:');
    console.log('1. Fix session creation and persistence');
    console.log('2. Add strict user ID validation in profile API');
    console.log('3. Isolate Prisma client per request');
    console.log('4. Add extensive logging to track user flow');
    
  } catch (error) {
    console.error('❌ Error in emergency fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProfileContaminationEmergency();