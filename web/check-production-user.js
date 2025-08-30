const { PrismaClient } = require('./src/generated/prisma');

async function checkProductionUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking production database for vikashgd@gmail.com...\n');
    
    // First, let's see the User table structure
    const userColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('📋 User table columns:');
    userColumns.forEach(col => console.log(`   - ${col.column_name}: ${col.data_type}`));
    
    // Check if user exists (using only columns that exist)
    const user = await prisma.$queryRaw`
      SELECT id, email, name, "createdAt", "updatedAt", "emailVerified", image
      FROM "User" 
      WHERE email = 'vikashgd@gmail.com';
    `;
    
    if (user.length > 0) {
      const userData = user[0];
      console.log('\n✅ User found:');
      console.log(`   ID: ${userData.id}`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Name: ${userData.name}`);
      console.log(`   Created: ${userData.createdAt}`);
      console.log(`   Email Verified: ${userData.emailVerified}`);
      
      // Check for report files
      const reportFiles = await prisma.$queryRaw`
        SELECT id, "objectKey", "reportType", "reportDate", "createdAt"
        FROM "ReportFile" 
        WHERE "userId" = ${userData.id}
        ORDER BY "createdAt" DESC;
      `;
      
      console.log('\n📊 Report Files:');
      if (reportFiles.length > 0) {
        reportFiles.forEach((report, index) => {
          console.log(`   ${index + 1}. ${report.objectKey} (${report.reportType || 'Unknown'}) - ${report.createdAt.toDateString()}`);
        });
      } else {
        console.log('   No report files found');
      }
      
      // Check for profile
      const profile = await prisma.$queryRaw`
        SELECT * FROM "PatientProfile" WHERE "userId" = ${userData.id};
      `;
      
      console.log('\n👤 Profile:');
      if (profile.length > 0) {
        const profileData = profile[0];
        console.log(`   Age: ${profileData.dateOfBirth ? new Date().getFullYear() - new Date(profileData.dateOfBirth).getFullYear() : 'Not set'}`);
        console.log(`   Gender: ${profileData.gender || 'Not set'}`);
        console.log(`   Height: ${profileData.height || 'Not set'}`);
        console.log(`   Weight: ${profileData.weight || 'Not set'}`);
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

checkProductionUser();