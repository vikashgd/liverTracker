/**
 * Debug script to identify and fix trends data issue
 * This script will test the entire trends data pipeline
 */

const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function debugTrendsIssue() {
  try {
    console.log('🔍 Starting comprehensive trends debugging...\n');

    // Step 1: Check if we have users with data
    const users = await prisma.user.findMany({
      take: 3,
      include: {
        reportFiles: {
          include: {
            metrics: true
          },
          take: 5
        }
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`👥 Found ${users.length} users`);
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.name} (${user.id})`);
      console.log(`   Reports: ${user.reportFiles.length}`);
      
      if (user.reportFiles.length > 0) {
        // Step 2: Check what metrics are available for this user
        const allMetrics = await prisma.extractedMetric.findMany({
          where: {
            report: { userId: user.id }
          },
          select: {
            name: true,
            value: true,
            unit: true,
            report: {
              select: {
                reportDate: true,
                reportType: true
              }
            }
          },
          orderBy: {
            report: { reportDate: 'desc' }
          },
          take: 50
        });

        console.log(`   📊 Total metrics: ${allMetrics.length}`);

        // Group metrics by name
        const metricGroups = {};
        allMetrics.forEach(metric => {
          if (!metricGroups[metric.name]) {
            metricGroups[metric.name] = [];
          }
          metricGroups[metric.name].push({
            value: metric.value,
            unit: metric.unit,
            date: metric.report.reportDate,
            type: metric.report.reportType
          });
        });

        console.log(`   📈 Unique metric types: ${Object.keys(metricGroups).length}`);
        
        // Show available metrics
        Object.keys(metricGroups).forEach(metricName => {
          const count = metricGroups[metricName].length;
          const latest = metricGroups[metricName][0];
          console.log(`     ${metricName}: ${count} points, latest: ${latest.value} ${latest.unit || 'no unit'} (${latest.date.toLocaleDateString()})`);
        });

        // Step 3: Test trend matching logic
        console.log('\n   🔍 Testing trend matching for common metrics:');
        const commonMetrics = ['ALT', 'AST', 'Bilirubin', 'Platelets', 'Albumin', 'Creatinine', 'INR'];
        const foundTrends = [];

        for (const targetMetric of commonMetrics) {
          // Find matching metrics (case insensitive, partial match)
          const matchingMetrics = Object.keys(metricGroups).filter(name => {
            const nameLower = name.toLowerCase();
            const targetLower = targetMetric.toLowerCase();
            
            return nameLower.includes(targetLower) || 
                   targetLower.includes(nameLower) ||
                   nameLower.replace(/[^a-z]/g, '').includes(targetLower.replace(/[^a-z]/g, '')) ||
                   targetLower.replace(/[^a-z]/g, '').includes(nameLower.replace(/[^a-z]/g, ''));
          });

          if (matchingMetrics.length > 0) {
            const bestMatch = matchingMetrics[0];
            const data = metricGroups[bestMatch];
            foundTrends.push({
              target: targetMetric,
              actual: bestMatch,
              dataPoints: data.length,
              latestValue: data[0].value,
              unit: data[0].unit || 'no unit'
            });
            console.log(`     ✅ ${targetMetric} → ${bestMatch} (${data.length} points)`);
          } else {
            console.log(`     ❌ ${targetMetric} → No match found`);
          }
        }

        // Step 4: Test share link creation and data aggregation
        console.log('\n   🔗 Testing share link creation...');
        
        try {
          // Create a test share link
          const shareLink = await prisma.shareLink.create({
            data: {
              token: `test-${Date.now()}`,
              userId: user.id,
              shareType: 'PROFESSIONAL',
              title: 'Test Trends Debug',
              description: 'Testing trends data aggregation',
              reportIds: user.reportFiles.map(r => r.id),
              includeProfile: true,
              includeDashboard: true,
              includeScoring: true,
              includeAI: true,
              includeFiles: true,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
              maxViews: 10,
              currentViews: 0,
              allowedEmails: [],
              isActive: true
            }
          });

          console.log(`     ✅ Created test share link: ${shareLink.token}`);

          // Step 5: Test the medical data aggregator
          console.log('\n   📊 Testing MedicalDataAggregator...');
          
          // Simulate the aggregator logic
          const simulatedTrends = [];
          
          for (const trend of foundTrends) {
            const data = metricGroups[trend.actual];
            
            // Convert to the expected format
            const chartSeries = {
              name: trend.target,
              data: data.map(point => ({
                date: point.date,
                value: point.value,
                isAbnormal: false, // We'll determine this based on reference ranges
                confidence: 0.8 // Default confidence
              })),
              unit: trend.unit,
              referenceRange: getReferenceRange(trend.target)
            };
            
            simulatedTrends.push(chartSeries);
          }

          console.log(`     📈 Simulated trends: ${simulatedTrends.length} series`);
          simulatedTrends.forEach(trend => {
            console.log(`       ${trend.name}: ${trend.data.length} points, unit: ${trend.unit}`);
          });

          // Clean up test share link
          await prisma.shareLink.delete({
            where: { id: shareLink.id }
          });
          console.log(`     🗑️ Cleaned up test share link`);

          // Step 6: Test actual API endpoint
          console.log('\n   🌐 Testing actual trends data flow...');
          
          // We can't easily test the API from here, but we can check the key components
          console.log('     ℹ️ To test the full API flow:');
          console.log(`       1. Create a share link for user ${user.id}`);
          console.log(`       2. Access /api/share/[token]/data`);
          console.log(`       3. Check the trends array in the response`);
          console.log(`       4. Verify trends are passed to TrendsAnalysisTab component`);

        } catch (shareError) {
          console.error('     ❌ Error testing share link:', shareError.message);
        }

        // Only test the first user with data
        break;
      }
    }

    console.log('\n🎯 DIAGNOSIS SUMMARY:');
    console.log('=====================================');
    
    const hasUsers = users.length > 0;
    const hasReports = users.some(u => u.reportFiles.length > 0);
    const hasMetrics = users.some(u => u.reportFiles.some(r => r.metrics.length > 0));
    
    console.log(`✅ Users in database: ${hasUsers ? 'YES' : 'NO'}`);
    console.log(`✅ Reports available: ${hasReports ? 'YES' : 'NO'}`);
    console.log(`✅ Metrics available: ${hasMetrics ? 'YES' : 'NO'}`);
    
    if (!hasUsers || !hasReports || !hasMetrics) {
      console.log('\n❌ ISSUE IDENTIFIED: Missing base data');
      console.log('   Solution: Ensure users have uploaded lab reports with extracted metrics');
    } else {
      console.log('\n✅ Base data looks good. Issue likely in:');
      console.log('   1. Medical platform getChartData method');
      console.log('   2. Data aggregator getTrendData method');
      console.log('   3. Component data flow');
      console.log('\n🔧 RECOMMENDED FIXES:');
      console.log('   1. Add more debugging to MedicalDataAggregator.getTrendData()');
      console.log('   2. Check medical platform repository.getChartSeries()');
      console.log('   3. Verify trends data is properly passed to React components');
    }

  } catch (error) {
    console.error('💥 Error during debugging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getReferenceRange(metric) {
  const ranges = {
    'ALT': { min: 7, max: 40, unit: 'U/L' },
    'AST': { min: 8, max: 40, unit: 'U/L' },
    'Bilirubin': { min: 0.2, max: 1.2, unit: 'mg/dL' },
    'Platelets': { min: 150, max: 450, unit: '×10³/μL' },
    'Albumin': { min: 3.5, max: 5.0, unit: 'g/dL' },
    'Creatinine': { min: 0.6, max: 1.2, unit: 'mg/dL' },
    'INR': { min: 0.8, max: 1.2, unit: '' }
  };
  
  return ranges[metric];
}

// Run the debug
debugTrendsIssue();