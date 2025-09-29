/**
 * SIMPLE CHECK - JUST TWO FLAGS
 * Using the generated Prisma client path
 */

const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function checkUserOnboarding() {
  console.log('🔍 Checking user onboarding status...');
  
  try {
    const userId = 'cmg0ip2yc0000l804tadf7ilx';
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        profile: { 
          select: { 
            gender: true, 
            height: true, 
            weight: true 
          } 
        },
        _count: { 
          select: { 
            reportFiles: true 
          } 
        }
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`\n👤 User: ${user.email}`);
    console.log(`📊 Profile:`, user.profile);
    console.log(`📄 Report count: ${user._count.reportFiles}`);
    
    // Flag 1: Has complete profile
    const hasProfile = !!(user.profile?.gender && user.profile?.height && user.profile?.weight);
    console.log(`\n🏷️  Flag 1 - Has Profile: ${hasProfile ? '✅' : '❌'}`);
    if (!hasProfile) {
      console.log('   Missing:', {
        gender: !user.profile?.gender,
        height: !user.profile?.height,
        weight: !user.profile?.weight
      });
    }
    
    // Flag 2: Has at least one report
    const hasReports = user._count.reportFiles > 0;
    console.log(`🏷️  Flag 2 - Has Reports: ${hasReports ? '✅' : '❌'}`);
    
    // Final result
    const canAccessDashboard = hasProfile && hasReports;
    console.log(`\n🎯 RESULT: Can Access Dashboard = ${canAccessDashboard ? '✅ YES' : '❌ NO'}`);
    console.log(`🎯 RESULT: Needs Onboarding = ${!canAccessDashboard ? '✅ YES' : '❌ NO'}`);
    
    if (!canAccessDashboard) {
      console.log('\n🔧 TO FIX:');
      if (!hasProfile) console.log('   - Complete profile (gender, height, weight)');
      if (!hasReports) console.log('   - Upload at least one report');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserOnboarding();