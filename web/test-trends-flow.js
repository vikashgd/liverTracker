/**
 * Test script to verify trends data flow in the sharing system
 */

const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function testTrendsFlow() {
  try {
    console.log('🧪 Testing trends data flow...\n');

    // Step 1: Find a user with data
    const user = await prisma.user.findFirst({
      include: {
        reportFiles: {
          include: {
            metrics: true
          },
          take: 3
        }
      }
    });

    if (!user || user.reportFiles.length === 0) {
      console.log('❌ No user with reports found');
      return;
    }

    console.log(`👤 Testing with user: ${user.name} (${user.id})`);
    console.log(`📊 User has ${user.reportFiles.length} reports`);

    // Step 2: Create a test share link
    const shareLink = await prisma.shareLink.create({
      data: {
        token: `test-trends-${Date.now()}`,
        userId: user.id,
        shareType: 'PROFESSIONAL',
        title: 'Test Trends Flow',
        description: 'Testing trends data flow',
        reportIds: user.reportFiles.map(r => r.id),
        includeProfile: true,
        includeDashboard: true,
        includeScoring: true,
        includeAI: true,
        includeFiles: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        maxViews: 10,
        currentViews: 0,
        allowedEmails: [],
        isActive: true
      }
    });

    console.log(`🔗 Created test share link: ${shareLink.token}`);

    // Step 3: Test the API endpoint
    console.log('\n🌐 Testing API endpoint...');
    
    try {
      const response = await fetch(`http://localhost:3000/api/share/${shareLink.token}/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API response received');
        console.log(`📊 Medical data structure:`, {
          hasReports: !!data.medicalData?.reports,
          hasTrends: !!data.medicalData?.reports?.trends,
          trendsType: typeof data.medicalData?.reports?.trends,
          trendsIsArray: Array.isArray(data.medicalData?.reports?.trends),
          trendsLength: data.medicalData?.reports?.trends?.length || 0,
          reportsKeys: Object.keys(data.medicalData?.reports || {}),
          individualReports: data.medicalData?.reports?.individual?.length || 0
        });

        if (data.medicalData?.reports?.trends && Array.isArray(data.medicalData.reports.trends)) {
          console.log('\n📈 Trends data:');
          data.medicalData.reports.trends.forEach((trend, index) => {
            console.log(`  ${index + 1}. ${trend.name}: ${trend.data?.length || 0} points, unit: ${trend.unit || 'none'}`);
          });
        } else {
          console.log('❌ No trends data found in API response');
          console.log('Raw trends value:', data.medicalData?.reports?.trends);
        }
      } else {
        console.log(`❌ API request failed: ${response.status}`);
        const errorText = await response.text();
        console.log('Error:', errorText);
      }
    } catch (apiError) {
      console.log(`❌ API request error: ${apiError.message}`);
      console.log('Make sure the development server is running on localhost:3000');
    }

    // Step 4: Clean up
    await prisma.shareLink.delete({
      where: { id: shareLink.id }
    });
    console.log('\n🗑️ Cleaned up test share link');

  } catch (error) {
    console.error('💥 Error testing trends flow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTrendsFlow();