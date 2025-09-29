/**
 * FINAL ONBOARDING FIX TEST
 * Test the ultra-simple onboarding solution
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFinalOnboardingFix() {
  console.log('🧪 Testing Final Onboarding Fix...');
  
  try {
    const userId = 'cmg0ip2yc0000l804tadf7ilx';
    
    // Test the database logic
    console.log('\n📋 Testing Database Logic:');
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
    
    console.log(`👤 User: ${user.email}`);
    console.log(`📊 Profile:`, user.profile);
    console.log(`📄 Report count: ${user._count.reportFiles}`);
    
    // Flag 1: Has complete profile
    const hasProfile = !!(user.profile?.gender && user.profile?.height && user.profile?.weight);
    console.log(`🏷️  Flag 1 - Has Profile: ${hasProfile ? '✅' : '❌'}`);
    
    // Flag 2: Has at least one report
    const hasReports = user._count.reportFiles > 0;
    console.log(`🏷️  Flag 2 - Has Reports: ${hasReports ? '✅' : '❌'}`);
    
    // Final result
    const canAccessDashboard = hasProfile && hasReports;
    const needsOnboarding = !canAccessDashboard;
    
    console.log(`\\n🎯 FINAL RESULT:`);
    console.log(`   canAccessDashboard: ${canAccessDashboard ? '✅ true' : '❌ false'}`);
    console.log(`   needsOnboarding: ${needsOnboarding ? '✅ true' : '❌ false'}`);
    
    // Test API response format
    console.log('\\n🌐 Expected API Response:');
    console.log(JSON.stringify({
      canAccessDashboard,
      needsOnboarding
    }, null, 2));
    
    // Test guard logic
    console.log('\\n🚦 Guard Logic Test:');
    console.log(`   isComplete (from canAccessDashboard): ${canAccessDashboard ? '✅ true' : '❌ false'}`);
    console.log(`   needsOnboarding: ${needsOnboarding ? '✅ true' : '❌ false'}`);
    
    if (canAccessDashboard && !needsOnboarding) {
      console.log('\\n✅ SUCCESS: User should access dashboard directly');
      console.log('   - Guard will allow dashboard access');
      console.log('   - No redirect to onboarding');
    } else {
      console.log('\\n❌ ISSUE: User will be redirected to onboarding');
      console.log('   - Missing profile or reports');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFinalOnboardingFix();