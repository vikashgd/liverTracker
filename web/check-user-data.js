const { PrismaClient } = require('./src/generated/prisma');

async function checkUserData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking user data for vikashgd@gmail.com...\n');
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: 'vikashgd@gmail.com' },
      include: {
        accounts: true,
        reportFiles: {
          select: {
            id: true,
            objectKey: true,
            reportType: true,
            reportDate: true,
            createdAt: true
          }
        },
        profile: true
      }
    });

    if (user) {
      console.log('✅ User found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Last Login: ${user.lastLoginAt}`);
      
      console.log('\n📊 Report Files:');
      if (user.reportFiles.length > 0) {
        user.reportFiles.forEach((report, index) => {
          console.log(`   ${index + 1}. ${report.objectKey} (${report.reportType || 'Unknown'}) - ${report.createdAt.toDateString()}`);
        });
      } else {
        console.log('   No report files found');
      }
      
      console.log('\n🔗 Linked Accounts:');
      if (user.accounts.length > 0) {
        user.accounts.forEach(account => {
          console.log(`   - ${account.provider} (${account.type})`);
        });
      } else {
        console.log('   No linked accounts');
      }
      
      console.log('\n👤 Profile:');
      if (user.profile) {
        console.log(`   Age: ${user.profile.age}`);
        console.log(`   Gender: ${user.profile.gender}`);
        console.log(`   Medical History: ${user.profile.medicalHistory ? 'Yes' : 'No'}`);
      } else {
        console.log('   No profile data');
      }
      
    } else {
      console.log('❌ No user found with email: vikashgd@gmail.com');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserData();