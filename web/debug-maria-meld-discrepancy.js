#!/usr/bin/env node

/**
 * Debug Maria's MELD Discrepancy
 * 
 * This script investigates why Maria's dashboard shows MELD 29 / Child-Pugh 10 (Class C)
 * but the shared report shows MELD 13 / Child-Pugh 8 (Class B)
 */

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function debugMariaMELDDiscrepancy() {
  console.log('🔍 DEBUGGING MARIA\'S MELD DISCREPANCY');
  console.log('=' .repeat(60));

  try {
    // 1. Find Maria's user account
    console.log('\n📊 1. FINDING MARIA\'S ACCOUNT');
    
    // Look for users with name containing "Maria"
    const mariaUsers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: 'Maria', mode: 'insensitive' } },
          { email: { contains: 'maria', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    console.log('Users matching "Maria":');
    for (const user of mariaUsers) {
      console.log(`  - ${user.name} (${user.email}) - ID: ${user.id}`);
    }

    if (mariaUsers.length === 0) {
      console.log('❌ No users found with name "Maria"');
      
      // Try to find the user from the share link we saw earlier
      const shareLinks = await prisma.shareLink.findMany({
        where: {
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      console.log('\nRecent share links:');
      for (const share of shareLinks) {
        console.log(`  - ${share.user.name} (${share.user.email}) - Token: ${share.token.substring(0, 20)}...`);
      }

      if (shareLinks.length > 0) {
        console.log(`\nUsing first user: ${shareLinks[0].user.name}`);
        mariaUsers.push(shareLinks[0].user);
      }
    }

    if (mariaUsers.length === 0) {
      console.log('❌ No users found to debug');
      return;
    }

    const mariaUser = mariaUsers[0];
    console.log(`\n🎯 Debugging user: ${mariaUser.name} (${mariaUser.id})`);

    // 2. Get all lab values for this user
    console.log('\n📊 2. GETTING ALL LAB VALUES');
    
    const meldMetrics = ['Bilirubin', 'Creatinine', 'INR', 'Sodium', 'Albumin'];
    const allLabValues = {};

    for (const metricName of meldMetrics) {
      const metrics = await prisma.extractedMetric.findMany({
        where: {
          report: { userId: mariaUser.id },
          name: { contains: metricName, mode: 'insensitive' }
        },
        include: {
          report: {
            select: {
              reportDate: true,
              reportType: true,
              createdAt: true
            }
          }
        },
        orderBy: [
          { report: { reportDate: 'desc' } },
          { createdAt: 'desc' }
        ]
      });

      allLabValues[metricName] = metrics;
      
      console.log(`\n  ${metricName} (${metrics.length} values):`);
      for (const metric of metrics.slice(0, 5)) { // Show top 5
        const date = metric.report.reportDate?.toISOString().split('T')[0] || 
                     metric.report.createdAt.toISOString().split('T')[0];
        console.log(`    - ${metric.name}: ${metric.value} ${metric.unit || ''} (${date})`);
      }
    }

    // 3. Calculate MELD using different methods
    console.log('\n📊 3. CALCULATING MELD USING DIFFERENT METHODS');

    // Method 1: Latest values (what shared report currently does)
    console.log('\n  Method 1: Latest Values (Current Shared Report Method)');
    const latestValues = {};
    for (const metricName of meldMetrics) {
      if (allLabValues[metricName] && allLabValues[metricName].length > 0) {
        const latest = allLabValues[metricName].find(m => m.value !== null);
        if (latest) {
          latestValues[metricName] = {
            value: latest.value,
            unit: latest.unit,
            date: latest.report.reportDate || latest.report.createdAt,
            name: latest.name
          };
        }
      }
    }

    console.log('  Latest values found:');
    for (const [metric, data] of Object.entries(latestValues)) {
      console.log(`    - ${metric}: ${data.value} ${data.unit || ''} (${data.date.toISOString().split('T')[0]})`);
    }

    if (latestValues.Bilirubin && latestValues.Creatinine && latestValues.INR) {
      const meld1 = calculateMELDManual(
        latestValues.Bilirubin.value,
        latestValues.Creatinine.value,
        latestValues.INR.value,
        latestValues.Sodium?.value
      );
      console.log(`  → MELD Result: ${meld1.meld} (MELD-Na: ${meld1.meldNa || 'N/A'})`);
    }

    // Method 2: Most recent report values (what dashboard might use)
    console.log('\n  Method 2: Most Recent Report Values');
    const mostRecentReport = await prisma.reportFile.findFirst({
      where: { userId: mariaUser.id },
      include: {
        metrics: {
          where: {
            name: {
              in: ['Bilirubin', 'Total Bilirubin', 'Creatinine', 'INR', 'Sodium', 'Albumin']
            }
          }
        }
      },
      orderBy: [
        { reportDate: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    if (mostRecentReport) {
      console.log(`  Most recent report: ${mostRecentReport.reportType} (${mostRecentReport.reportDate?.toISOString().split('T')[0]})`);
      console.log('  Values in this report:');
      
      const reportValues = {};
      for (const metric of mostRecentReport.metrics) {
        console.log(`    - ${metric.name}: ${metric.value} ${metric.unit || ''}`);
        
        // Map to standard names
        if (metric.name.toLowerCase().includes('bilirubin')) reportValues.bilirubin = metric.value;
        if (metric.name.toLowerCase().includes('creatinine')) reportValues.creatinine = metric.value;
        if (metric.name.toLowerCase().includes('inr')) reportValues.inr = metric.value;
        if (metric.name.toLowerCase().includes('sodium')) reportValues.sodium = metric.value;
        if (metric.name.toLowerCase().includes('albumin')) reportValues.albumin = metric.value;
      }

      if (reportValues.bilirubin && reportValues.creatinine && reportValues.inr) {
        const meld2 = calculateMELDManual(
          reportValues.bilirubin,
          reportValues.creatinine,
          reportValues.inr,
          reportValues.sodium
        );
        console.log(`  → MELD Result: ${meld2.meld} (MELD-Na: ${meld2.meldNa || 'N/A'})`);
      }
    }

    // Method 3: Check if there are manual entries or profile data
    console.log('\n  Method 3: Check Profile and Manual Data');
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: mariaUser.id }
    });

    if (profile) {
      console.log('  Patient Profile found:');
      console.log(`    - Gender: ${profile.gender}`);
      console.log(`    - On Dialysis: ${profile.onDialysis}`);
      console.log(`    - Dialysis Sessions/Week: ${profile.dialysisSessionsPerWeek}`);
      console.log(`    - Ascites: ${profile.ascites}`);
      console.log(`    - Encephalopathy: ${profile.encephalopathy}`);
    }

    // 4. Check what the medical platform would calculate
    console.log('\n📊 4. TESTING MEDICAL PLATFORM CALCULATION');
    try {
      // This would require importing the platform, but let's simulate
      console.log('  (Platform calculation would go here)');
    } catch (error) {
      console.log('  ❌ Cannot test platform calculation:', error.message);
    }

    // 5. Check for any recent manual entries or corrections
    console.log('\n📊 5. CHECKING FOR RECENT DATA CHANGES');
    
    const recentMetrics = await prisma.extractedMetric.findMany({
      where: {
        report: { userId: mariaUser.id },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      },
      include: {
        report: {
          select: {
            reportDate: true,
            reportType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`  Recent metrics (last 7 days): ${recentMetrics.length}`);
    for (const metric of recentMetrics.slice(0, 10)) {
      console.log(`    - ${metric.name}: ${metric.value} ${metric.unit || ''} (${metric.createdAt.toISOString().split('T')[0]})`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎯 ANALYSIS AND RECOMMENDATIONS');
    console.log('='.repeat(60));
    
    console.log('\n📋 Key Findings:');
    console.log('1. Dashboard shows: MELD 29, Child-Pugh 10 (Class C)');
    console.log('2. Shared report shows: MELD 13, Child-Pugh 8 (Class B)');
    console.log('3. This suggests different data sources or calculation methods');

    console.log('\n🔧 Potential Causes:');
    console.log('- Dashboard uses different/newer lab values');
    console.log('- Dashboard includes manual corrections or profile adjustments');
    console.log('- Shared report uses outdated or different extraction logic');
    console.log('- Different handling of dialysis adjustments or clinical factors');

    console.log('\n💡 Next Steps:');
    console.log('1. Make shared report use the same calculation as dashboard');
    console.log('2. Ensure both use the most recent and accurate lab values');
    console.log('3. Include all clinical adjustments (dialysis, gender, etc.)');
    console.log('4. Add logging to track which values are being used');

  } catch (error) {
    console.error('❌ Error during Maria MELD debugging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Manual MELD calculation function
function calculateMELDManual(bilirubin, creatinine, inr, sodium) {
  const safeBilirubin = Math.max(bilirubin, 1.0);
  const safeCreatinine = Math.max(creatinine, 1.0);
  const safeINR = Math.max(inr, 1.0);

  const meldRaw = 3.78 * Math.log(safeBilirubin) + 
                  11.2 * Math.log(safeINR) + 
                  9.57 * Math.log(safeCreatinine) + 
                  6.43;
  
  const meld = Math.max(6, Math.min(40, Math.round(meldRaw)));

  let meldNa;
  if (sodium) {
    const safeSodium = Math.max(125, Math.min(137, sodium));
    meldNa = meld + 1.32 * (137 - safeSodium) - (0.033 * meld * (137 - safeSodium));
    meldNa = Math.max(6, Math.min(40, Math.round(meldNa)));
  }

  return { meld, meldNa };
}

// Run the debug script
debugMariaMELDDiscrepancy().catch(console.error);