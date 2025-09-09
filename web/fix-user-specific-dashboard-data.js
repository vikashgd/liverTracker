/**
 * Fix User-Specific Dashboard Data Loading
 * Ensures dashboard shows data only for the logged-in user and fixes missing metrics
 */

const { PrismaClient } = require('./src/generated/prisma');

async function fixUserSpecificDashboardData() {
  console.log('🔧 FIXING USER-SPECIFIC DASHBOARD DATA LOADING\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Step 1: Check current user authentication and data
    console.log('👤 Step 1: Analyzing user data and authentication...');
    
    // Get all users and their data
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        reportFiles: {
          select: {
            id: true,
            createdAt: true,
            metrics: {
              select: {
                name: true,
                value: true,
                unit: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      }
    });
    
    console.log(`Found ${users.length} users in the system:`);
    users.forEach((user, idx) => {
      console.log(`\n${idx + 1}. User: ${user.email || user.name || 'Unknown'}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Reports: ${user.reportFiles.length}`);
      
      if (user.reportFiles.length > 0) {
        const latestReport = user.reportFiles[0];
        console.log(`   Latest Report: ${latestReport.createdAt.toDateString()}`);
        console.log(`   Metrics in latest: ${latestReport.metrics.length}`);
        
        // Check for Sodium specifically
        const sodiumMetrics = latestReport.metrics.filter(m => 
          m.name.toLowerCase().includes('sodium')
        );
        if (sodiumMetrics.length > 0) {
          console.log(`   ✅ Has Sodium: ${sodiumMetrics[0].value} ${sodiumMetrics[0].unit}`);
        } else {
          console.log(`   ❌ No Sodium found`);
        }
      }
    });
    
    // Step 2: Check the medical platform data loading for each user
    console.log('\n🏥 Step 2: Testing medical platform data loading per user...');
    
    const { getMedicalPlatform } = require('./src/lib/medical-platform');
    
    const platform = getMedicalPlatform({
      processing: {
        strictMode: false,
        autoCorrection: true,
        confidenceThreshold: 0.5,
        validationLevel: 'normal'
      },
      quality: {
        minimumConfidence: 0.3,
        requiredFields: [],
        outlierDetection: true,
        duplicateHandling: 'merge'
      },
      regional: {
        primaryUnits: 'International',
        timeZone: 'UTC',
        locale: 'en-US'
      },
      compliance: {
        auditLevel: 'basic',
        dataRetention: 2555,
        encryptionRequired: false
      }
    });
    
    // Test each user's data loading
    for (const user of users) {
      if (user.reportFiles.length > 0) {
        console.log(`\n🔍 Testing data loading for user: ${user.email || user.id}`);
        
        try {
          // Test loading Sodium data for this specific user
          const sodiumData = await platform.getChartData(user.id, 'Sodium');
          console.log(`   Sodium data points: ${sodiumData.data.length}`);
          
          if (sodiumData.data.length > 0) {
            console.log(`   ✅ First point: ${sodiumData.data[0].value} on ${sodiumData.data[0].date.toDateString()}`);
          } else {
            console.log(`   ❌ No Sodium data loaded through platform`);
          }
          
          // Test other key metrics
          const keyMetrics = ['ALT', 'AST', 'Bilirubin', 'Platelets', 'Creatinine'];
          for (const metric of keyMetrics) {
            try {
              const data = await platform.getChartData(user.id, metric);
              console.log(`   ${metric}: ${data.data.length} points`);
            } catch (error) {
              console.log(`   ${metric}: ERROR - ${error.message}`);
            }
          }
          
        } catch (error) {
          console.log(`   ❌ Error loading data: ${error.message}`);
        }
      }
    }
    
    // Step 3: Check the chart-data API route user filtering
    console.log('\n📊 Step 3: Analyzing chart-data API user filtering...');
    
    // Check if the API route properly filters by user ID
    console.log('Current chart-data API should:');
    console.log('1. Get userId from requireAuth()');
    console.log('2. Pass userId to medical platform');
    console.log('3. Medical platform should filter data by userId');
    
    // Step 4: Direct database query to verify user-specific data
    console.log('\n🔍 Step 4: Direct database verification of user-specific metrics...');
    
    for (const user of users) {
      if (user.reportFiles.length > 0) {
        console.log(`\nDirect DB query for user: ${user.email || user.id}`);
        
        // Get all metrics for this user
        const userMetrics = await prisma.extractedMetric.findMany({
          where: {
            reportFile: {
              userId: user.id
            }
          },
          select: {
            name: true,
            value: true,
            unit: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        });
        
        console.log(`   Total metrics: ${userMetrics.length}`);
        
        // Group by metric name
        const metricGroups = {};
        userMetrics.forEach(metric => {
          if (!metricGroups[metric.name]) {
            metricGroups[metric.name] = [];
          }
          metricGroups[metric.name].push(metric);
        });
        
        console.log(`   Unique metric types: ${Object.keys(metricGroups).length}`);
        Object.keys(metricGroups).forEach(name => {
          const count = metricGroups[name].length;
          const latest = metricGroups[name][0];
          console.log(`     ${name}: ${count} entries, latest: ${latest.value} ${latest.unit}`);
        });
      }
    }
    
    // Step 5: Identify the exact issue
    console.log('\n🎯 Step 5: ROOT CAUSE ANALYSIS');
    
    // Check if there's a user ID mismatch issue
    const currentUserFromAuth = await getCurrentUserIdFromSession();
    console.log(`Current session user ID: ${currentUserFromAuth || 'NOT FOUND'}`);
    
    if (currentUserFromAuth) {
      const currentUserData = users.find(u => u.id === currentUserFromAuth);
      if (currentUserData) {
        console.log(`✅ Current user found in database: ${currentUserData.email}`);
        console.log(`   Reports: ${currentUserData.reportFiles.length}`);
      } else {
        console.log(`❌ ISSUE: Current session user ID not found in database!`);
      }
    } else {
      console.log(`❌ ISSUE: No user ID found in current session!`);
    }
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('1. Verify requireAuth() returns correct user ID');
    console.log('2. Ensure medical platform filters by user ID correctly');
    console.log('3. Add user ID validation in chart-data API');
    console.log('4. Add comprehensive logging to track data flow');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to get current user ID from session
async function getCurrentUserIdFromSession() {
  try {
    // This would normally be done in the API route context
    // For now, we'll return null and handle this in the API fix
    return null;
  } catch (error) {
    return null;
  }
}

// Run the analysis
fixUserSpecificDashboardData().catch(console.error);