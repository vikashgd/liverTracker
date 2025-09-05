/**
 * Check Profile Table Situation
 */

const { PrismaClient } = require('./src/generated/prisma');

async function checkProfileTable() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 PROFILE TABLE ANALYSIS');
    console.log('=========================\n');

    // Check what profile-related tables exist
    const profileTables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%Profile%' OR table_name LIKE '%profile%')
      ORDER BY table_name
    `;
    
    console.log('📊 Profile-related tables found:');
    profileTables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    // Test Prisma operations for PatientProfile
    console.log('\n🧪 PRISMA PROFILE OPERATIONS TEST:');
    try {
      const patientProfileCount = await prisma.patientProfile.count();
      console.log(`   ✅ PatientProfile count: ${patientProfileCount}`);
      
      // Try to get all patient profiles
      const profiles = await prisma.patientProfile.findMany({
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
      
      console.log(`   📋 Patient profiles details:`);
      profiles.forEach(profile => {
        console.log(`      - User: ${profile.user.email} (${profile.user.name || 'No name'})`);
        console.log(`        Profile ID: ${profile.id}`);
        console.log(`        Has data: ${profile.dateOfBirth ? 'Yes' : 'No'}`);
      });
      
    } catch (profileError) {
      console.log(`   ❌ PatientProfile operations error: ${profileError.message}`);
    }
    
    // Check users and their profile status
    console.log('\n👥 USER PROFILE STATUS:');
    try {
      const users = await prisma.user.findMany({
        include: {
          profile: true
        }
      });
      
      console.log(`   📊 Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`      - ${user.email} (${user.name || 'No name'})`);
        console.log(`        Profile completed: ${user.profileCompleted}`);
        console.log(`        Has profile data: ${user.profile ? 'Yes' : 'No'}`);
        console.log(`        Onboarding completed: ${user.onboardingCompleted}`);
        console.log(`        First report uploaded: ${user.firstReportUploaded}`);
      });
      
    } catch (userError) {
      console.log(`   ❌ User operations error: ${userError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Profile check error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfileTable().catch(console.error);