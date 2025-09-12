#!/usr/bin/env node

/**
 * Invalidate All Sessions - Emergency Session Cleanup
 */

const { PrismaClient } = require('./src/generated/prisma');

async function invalidateAllSessions() {
  console.log('🔄 INVALIDATING ALL SESSIONS');
  
  const prisma = new PrismaClient();
  
  try {
    // Delete all sessions to force re-authentication
    const deletedSessions = await prisma.session.deleteMany({});
    console.log(`✅ Deleted ${deletedSessions.count} sessions`);
    
    console.log('🔄 All users must now re-authenticate');
    console.log('🔄 This will prevent any session contamination');
    
  } catch (error) {
    console.error('❌ Error invalidating sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

invalidateAllSessions().catch(console.error);