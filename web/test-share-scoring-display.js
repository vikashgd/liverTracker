#!/usr/bin/env node

/**
 * Test Share Scoring Display
 * 
 * This script tests what the shared report actually shows for scoring
 * to identify discrepancies between calculated and displayed values.
 */

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function testShareScoringDisplay() {
  console.log('🔍 TESTING SHARE SCORING DISPLAY');
  console.log('=' .repeat(50));

  try {
    // 1. Find a recent share link
    console.log('\n📊 1. FINDING RECENT SHARE LINKS');
    const shareLinks = await prisma.shareLink.findMany({
      where: {
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    });

    if (shareLinks.length === 0) {
      console.log('❌ No active share links found');
      
      // Create a test share link
      console.log('\n📊 Creating a test share link...');
      
      const testUserId = 'cmfhrlzwq0000jr048fw0vhgw'; // User from previous test
      const testShare = await prisma.shareLink.create({
        data: {
          token: 'test-' + Date.now(),
          userId: testUserId,
          shareType: 'COMPLETE_PROFILE',
          title: 'Test Medical Report Share',
          description: 'Test share for debugging MELD calculation',
          includeProfile: true,
          includeDashboard: true,
          includeScoring: true,
          includeAI: true,
          includeFiles: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          reportIds: []
        }
      });
      
      console.log(`✅ Created test share: ${testShare.token}`);
      shareLinks.push(testShare);
    }

    const testShare = shareLinks[0];
    console.log(`Using share: ${testShare.token} (User: ${testShare.userId})`);

    // 2. Test the medical data aggregator directly
    console.log('\n📊 2. TESTING MEDICAL DATA AGGREGATOR');
    
    try {
      const { MedicalDataAggregator } = require('./src/lib/medical-sharing/medical-data-aggregator');
      const aggregator = new MedicalDataAggregator();
      
      console.log('Aggregating medical data...');
      const medicalData = await aggregator.aggregateForSharing(testShare.userId, testShare);
      
      console.log('\n🧮 SCORING DATA FROM AGGREGATOR:');
      console.log('Raw scoring object:', JSON.stringify(medicalData.scoring, null, 2));
      
      if (medicalData.scoring.meld) {
        console.log('\n✅ MELD Data:');
        console.log(`  - Score: ${medicalData.scoring.meld.score}`);
        console.log(`  - Class: ${medicalData.scoring.meld.class}`);
        console.log(`  - Components:`, medicalData.scoring.meld.components);
        console.log(`  - Calculated At: ${medicalData.scoring.meld.calculatedAt}`);
      } else {
        console.log('\n❌ No MELD data in aggregated results');
      }
      
      if (medicalData.scoring.childPugh) {
        console.log('\n✅ Child-Pugh Data:');
        console.log(`  - Score: ${medicalData.scoring.childPugh.score}`);
        console.log(`  - Class: ${medicalData.scoring.childPugh.class}`);
        console.log(`  - Components:`, medicalData.scoring.childPugh.components);
        console.log(`  - Calculated At: ${medicalData.scoring.childPugh.calculatedAt}`);
      } else {
        console.log('\n❌ No Child-Pugh data in aggregated results');
      }

      // 3. Test what the API would return
      console.log('\n📊 3. TESTING SHARE API RESPONSE');
      
      const apiResponse = {
        success: true,
        medicalData,
        shareInfo: {
          title: testShare.title,
          description: testShare.description,
          shareType: testShare.shareType,
          expiresAt: testShare.expiresAt,
          generatedAt: testShare.createdAt
        }
      };
      
      console.log('\nAPI Response scoring section:');
      console.log(JSON.stringify(apiResponse.medicalData.scoring, null, 2));

      // 4. Check what the scoring tab component would receive
      console.log('\n📊 4. WHAT SCORING TAB COMPONENT RECEIVES');
      
      const scoringTabProps = medicalData.scoring;
      
      console.log('Props passed to ScoringTab:');
      console.log(`  - Has MELD: ${!!(scoringTabProps?.meld && scoringTabProps.meld.score !== undefined)}`);
      console.log(`  - Has Child-Pugh: ${!!(scoringTabProps?.childPugh && scoringTabProps.childPugh.class !== undefined)}`);
      
      if (scoringTabProps?.meld) {
        console.log(`  - MELD Score Display: ${scoringTabProps.meld.score || scoringTabProps.meld.current?.score || '--'}`);
      }
      
      if (scoringTabProps?.childPugh) {
        console.log(`  - Child-Pugh Class Display: ${scoringTabProps.childPugh.class || scoringTabProps.childPugh.current?.class || '--'}`);
        console.log(`  - Child-Pugh Score Display: ${scoringTabProps.childPugh.score || scoringTabProps.childPugh.current?.score || '--'}`);
      }

      // 5. Compare with manual calculation
      console.log('\n📊 5. COMPARISON WITH MANUAL CALCULATION');
      
      // Get the same latest values we calculated manually
      const latestBilirubin = await prisma.extractedMetric.findFirst({
        where: {
          report: { userId: testShare.userId },
          name: { contains: 'Bilirubin', mode: 'insensitive' },
          value: { not: null }
        },
        include: { report: { select: { reportDate: true } } },
        orderBy: [{ report: { reportDate: 'desc' } }, { createdAt: 'desc' }]
      });
      
      const latestCreatinine = await prisma.extractedMetric.findFirst({
        where: {
          report: { userId: testShare.userId },
          name: { contains: 'Creatinine', mode: 'insensitive' },
          value: { not: null }
        },
        include: { report: { select: { reportDate: true } } },
        orderBy: [{ report: { reportDate: 'desc' } }, { createdAt: 'desc' }]
      });
      
      const latestINR = await prisma.extractedMetric.findFirst({
        where: {
          report: { userId: testShare.userId },
          name: { contains: 'INR', mode: 'insensitive' },
          value: { not: null }
        },
        include: { report: { select: { reportDate: true } } },
        orderBy: [{ report: { reportDate: 'desc' } }, { createdAt: 'desc' }]
      });

      console.log('\nManual calculation inputs:');
      console.log(`  - Bilirubin: ${latestBilirubin?.value} ${latestBilirubin?.unit}`);
      console.log(`  - Creatinine: ${latestCreatinine?.value} ${latestCreatinine?.unit}`);
      console.log(`  - INR: ${latestINR?.value} ${latestINR?.unit}`);

      if (latestBilirubin?.value && latestCreatinine?.value && latestINR?.value) {
        const safeBilirubin = Math.max(latestBilirubin.value, 1.0);
        const safeCreatinine = Math.max(latestCreatinine.value, 1.0);
        const safeINR = Math.max(latestINR.value, 1.0);

        const meldRaw = 3.78 * Math.log(safeBilirubin) + 
                        11.2 * Math.log(safeINR) + 
                        9.57 * Math.log(safeCreatinine) + 
                        6.43;
        
        const manualMELD = Math.max(6, Math.min(40, Math.round(meldRaw)));
        
        console.log(`\nManual MELD calculation: ${manualMELD}`);
        console.log(`Aggregator MELD result: ${medicalData.scoring.meld?.score || 'null'}`);
        
        if (medicalData.scoring.meld?.score !== manualMELD) {
          console.log('⚠️  MISMATCH DETECTED!');
          console.log(`Expected: ${manualMELD}, Got: ${medicalData.scoring.meld?.score}`);
        } else {
          console.log('✅ MELD scores match');
        }
      }

    } catch (error) {
      console.log('❌ Error testing aggregator:', error.message);
      console.log('Stack:', error.stack);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎯 DIAGNOSIS SUMMARY');
    console.log('='.repeat(50));
    
    console.log('\n📋 What to check in the shared report:');
    console.log('1. Visit the share link and check what MELD/Child-Pugh scores are displayed');
    console.log('2. Compare with the manual calculation results above');
    console.log('3. Check if the issue is in calculation vs display');
    console.log('4. Verify that the latest lab values are being used correctly');
    
    console.log(`\n🔗 Test share link: https://livertracker.com/share/${testShare.token}`);

  } catch (error) {
    console.error('❌ Error during share scoring test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testShareScoringDisplay().catch(console.error);