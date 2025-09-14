#!/usr/bin/env node

/**
 * Debug MELD Calculation in Shared Reports
 * 
 * This script investigates how MELD and Child-Pugh scores are calculated
 * in the shared reports to identify why they might be showing incorrect values.
 */

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function debugMELDCalculation() {
  console.log('🔍 DEBUGGING MELD CALCULATION IN SHARED REPORTS');
  console.log('=' .repeat(60));

  try {
    // 1. Check what users have reports
    console.log('\n📊 1. CHECKING USERS WITH REPORTS');
    const usersWithReports = await prisma.reportFile.groupBy({
      by: ['userId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    console.log('Users with most reports:');
    for (const user of usersWithReports) {
      console.log(`  - User ${user.userId}: ${user._count.id} reports`);
    }

    if (usersWithReports.length === 0) {
      console.log('❌ No users with reports found');
      return;
    }

    // Use the user with most reports for testing
    const testUserId = usersWithReports[0].userId;
    console.log(`\n🎯 Using user ${testUserId} for MELD analysis`);

    // 2. Check what metrics this user has
    console.log('\n📊 2. CHECKING AVAILABLE METRICS FOR MELD CALCULATION');
    const meldMetrics = ['Bilirubin', 'Creatinine', 'INR', 'Sodium', 'Albumin'];
    
    for (const metricName of meldMetrics) {
      const metrics = await prisma.extractedMetric.findMany({
        where: {
          report: { userId: testUserId },
          name: {
            contains: metricName,
            mode: 'insensitive'
          }
        },
        include: {
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
        take: 3
      });

      console.log(`\n  ${metricName}:`);
      if (metrics.length === 0) {
        console.log(`    ❌ No ${metricName} values found`);
      } else {
        console.log(`    ✅ Found ${metrics.length} values:`);
        for (const metric of metrics) {
          console.log(`      - ${metric.name}: ${metric.value} ${metric.unit || ''} (${metric.report.reportDate?.toISOString().split('T')[0] || 'No date'})`);
        }
      }
    }

    // 3. Get latest values for MELD calculation
    console.log('\n📊 3. GETTING LATEST VALUES FOR MELD CALCULATION');
    const latestValues = new Map();
    
    for (const metricName of meldMetrics) {
      const latestMetric = await prisma.extractedMetric.findFirst({
        where: {
          report: { userId: testUserId },
          name: {
            contains: metricName,
            mode: 'insensitive'
          },
          value: { not: null }
        },
        include: {
          report: {
            select: {
              reportDate: true
            }
          }
        },
        orderBy: [
          { report: { reportDate: 'desc' } },
          { createdAt: 'desc' }
        ]
      });

      if (latestMetric && latestMetric.value !== null) {
        latestValues.set(metricName, {
          value: latestMetric.value,
          unit: latestMetric.unit,
          date: latestMetric.report.reportDate,
          name: latestMetric.name
        });
        console.log(`  ✅ ${metricName}: ${latestMetric.value} ${latestMetric.unit || ''} (${latestMetric.report.reportDate?.toISOString().split('T')[0] || 'No date'})`);
      } else {
        console.log(`  ❌ ${metricName}: No valid value found`);
      }
    }

    // 4. Calculate MELD score manually
    console.log('\n📊 4. MANUAL MELD CALCULATION');
    
    const bilirubin = latestValues.get('Bilirubin');
    const creatinine = latestValues.get('Creatinine');
    const inr = latestValues.get('INR');
    const sodium = latestValues.get('Sodium');
    const albumin = latestValues.get('Albumin');

    console.log('\nMELD Parameters:');
    console.log(`  - Bilirubin: ${bilirubin ? `${bilirubin.value} ${bilirubin.unit}` : 'MISSING'}`);
    console.log(`  - Creatinine: ${creatinine ? `${creatinine.value} ${creatinine.unit}` : 'MISSING'}`);
    console.log(`  - INR: ${inr ? `${inr.value} ${inr.unit}` : 'MISSING'}`);
    console.log(`  - Sodium: ${sodium ? `${sodium.value} ${sodium.unit}` : 'MISSING (optional)'}`);
    console.log(`  - Albumin: ${albumin ? `${albumin.value} ${albumin.unit}` : 'MISSING (optional)'}`);

    if (bilirubin && creatinine && inr) {
      // Calculate MELD using the same formula as the calculator
      const safeBilirubin = Math.max(bilirubin.value, 1.0);
      const safeCreatinine = Math.max(creatinine.value, 1.0);
      const safeINR = Math.max(inr.value, 1.0);

      const meldRaw = 3.78 * Math.log(safeBilirubin) + 
                      11.2 * Math.log(safeINR) + 
                      9.57 * Math.log(safeCreatinine) + 
                      6.43;
      
      const meldScore = Math.max(6, Math.min(40, Math.round(meldRaw)));

      console.log('\n🧮 MELD CALCULATION RESULT:');
      console.log(`  Raw MELD: ${meldRaw.toFixed(2)}`);
      console.log(`  Final MELD: ${meldScore}`);

      // Calculate MELD-Na if sodium available
      if (sodium) {
        const safeSodium = Math.max(125, Math.min(137, sodium.value));
        const meldNa = meldScore + 1.32 * (137 - safeSodium) - (0.033 * meldScore * (137 - safeSodium));
        const finalMeldNa = Math.max(6, Math.min(40, Math.round(meldNa)));
        console.log(`  MELD-Na: ${finalMeldNa}`);
      }

      // Calculate Child-Pugh if albumin available
      if (albumin) {
        let childPughScore = 0;
        
        // Bilirubin points
        if (bilirubin.value < 2.0) childPughScore += 1;
        else if (bilirubin.value <= 3.0) childPughScore += 2;
        else childPughScore += 3;
        
        // Albumin points
        if (albumin.value > 3.5) childPughScore += 1;
        else if (albumin.value >= 2.8) childPughScore += 2;
        else childPughScore += 3;
        
        // INR points
        if (inr.value < 1.7) childPughScore += 1;
        else if (inr.value <= 2.3) childPughScore += 2;
        else childPughScore += 3;
        
        // Assume no ascites/encephalopathy (add 2 points)
        childPughScore += 2;
        
        const childPughClass = childPughScore <= 6 ? 'A' : childPughScore <= 9 ? 'B' : 'C';
        
        console.log(`  Child-Pugh Score: ${childPughScore} (Class ${childPughClass})`);
        console.log(`    - Bilirubin contribution: ${bilirubin.value < 2.0 ? 1 : bilirubin.value <= 3.0 ? 2 : 3} points`);
        console.log(`    - Albumin contribution: ${albumin.value > 3.5 ? 1 : albumin.value >= 2.8 ? 2 : 3} points`);
        console.log(`    - INR contribution: ${inr.value < 1.7 ? 1 : inr.value <= 2.3 ? 2 : 3} points`);
        console.log(`    - Ascites/Encephalopathy: 2 points (assumed none)`);
      }

    } else {
      console.log('\n❌ Cannot calculate MELD - missing required parameters');
      const missing = [];
      if (!bilirubin) missing.push('Bilirubin');
      if (!creatinine) missing.push('Creatinine');
      if (!inr) missing.push('INR');
      console.log(`Missing: ${missing.join(', ')}`);
    }

    // 5. Check patient profile for additional context
    console.log('\n📊 5. CHECKING PATIENT PROFILE');
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: testUserId }
    });

    if (profile) {
      console.log('Patient Profile found:');
      console.log(`  - Gender: ${profile.gender || 'Not specified'}`);
      console.log(`  - On Dialysis: ${profile.onDialysis ? 'Yes' : 'No'}`);
      if (profile.onDialysis) {
        console.log(`  - Dialysis Sessions/Week: ${profile.dialysisSessionsPerWeek || 'Not specified'}`);
        console.log(`  - Dialysis Type: ${profile.dialysisType || 'Not specified'}`);
      }
      console.log(`  - Liver Disease Type: ${profile.liverDiseaseType || 'Not specified'}`);
      console.log(`  - Ascites: ${profile.ascites || 'Not specified'}`);
      console.log(`  - Encephalopathy: ${profile.encephalopathy || 'Not specified'}`);
    } else {
      console.log('❌ No patient profile found');
    }

    // 6. Check what the medical platform would return
    console.log('\n📊 6. TESTING MEDICAL PLATFORM CALCULATION');
    try {
      const { getMedicalPlatform } = require('./src/lib/medical-platform/platform');
      const platform = getMedicalPlatform();
      
      console.log('Getting latest values from platform...');
      const platformLatestValues = await platform.getLatestValues(testUserId);
      
      console.log('Platform latest values:');
      for (const [key, value] of platformLatestValues) {
        console.log(`  - ${key}: ${value.value} ${value.unit || ''}`);
      }

      console.log('\nTrying platform MELD calculation...');
      const meldResult = await platform.calculateMELD(testUserId);
      
      if (meldResult) {
        console.log('✅ Platform MELD Result:');
        console.log(`  - MELD Score: ${meldResult.meld}`);
        console.log(`  - MELD-Na: ${meldResult.meldNa || 'Not calculated'}`);
        console.log(`  - Interpretation: ${meldResult.interpretation}`);
        console.log(`  - Urgency: ${meldResult.urgency}`);
        console.log(`  - Confidence: ${meldResult.confidence}`);
        console.log(`  - Warnings: ${meldResult.warnings.join(', ') || 'None'}`);
        console.log(`  - Missing Parameters: ${meldResult.missingParameters.join(', ') || 'None'}`);
      } else {
        console.log('❌ Platform returned null MELD result');
      }

    } catch (error) {
      console.log('❌ Error testing platform calculation:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎯 SUMMARY AND RECOMMENDATIONS');
    console.log('='.repeat(60));
    
    console.log('\n📋 Key Findings:');
    console.log(`1. User ${testUserId} has ${usersWithReports[0]._count.id} reports`);
    
    const availableMetrics = [];
    const missingMetrics = [];
    for (const metric of meldMetrics) {
      if (latestValues.has(metric)) {
        availableMetrics.push(metric);
      } else {
        missingMetrics.push(metric);
      }
    }
    
    console.log(`2. Available MELD metrics: ${availableMetrics.join(', ') || 'None'}`);
    console.log(`3. Missing MELD metrics: ${missingMetrics.join(', ') || 'None'}`);
    
    if (availableMetrics.length >= 3) {
      console.log('4. ✅ Sufficient data for MELD calculation');
    } else {
      console.log('4. ❌ Insufficient data for MELD calculation');
    }

    console.log('\n🔧 Potential Issues:');
    if (missingMetrics.length > 0) {
      console.log('- Missing required lab values for accurate MELD calculation');
    }
    if (!profile) {
      console.log('- No patient profile found (affects dialysis adjustments)');
    }
    if (profile && profile.onDialysis && !profile.dialysisSessionsPerWeek) {
      console.log('- Dialysis status unclear (affects creatinine adjustment)');
    }

    console.log('\n💡 Recommendations:');
    console.log('1. Ensure all required lab values are extracted: Bilirubin, Creatinine, INR');
    console.log('2. Include optional values for better accuracy: Sodium, Albumin');
    console.log('3. Complete patient profile with dialysis and clinical information');
    console.log('4. Verify unit conversions are working correctly');
    console.log('5. Check that the medical platform is using the latest values correctly');

  } catch (error) {
    console.error('❌ Error during MELD debugging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug script
debugMELDCalculation().catch(console.error);