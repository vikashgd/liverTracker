#!/usr/bin/env node

/**
 * INVESTIGATE AI EXTRACTION FAILURE
 * Check what broke the AI extraction pipeline
 */

const { PrismaClient } = require('./src/generated/prisma');

async function investigateAIExtractionFailure() {
  console.log('🔍 INVESTIGATING AI EXTRACTION FAILURE');
  console.log('=====================================\n');

  const prisma = new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    // Check recent reports and their extraction status
    console.log('📋 RECENT REPORTS ANALYSIS');
    console.log('-------------------------');
    
    const recentReports = await prisma.reportFile.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        user: {
          select: { email: true }
        },
        metrics: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${recentReports.length} reports in last 7 days:\n`);

    recentReports.forEach((report, index) => {
      const hoursAgo = Math.round((Date.now() - report.createdAt.getTime()) / (1000 * 60 * 60));
      const hasExtractedJson = !!report.extractedJson;
      const hasMetrics = report.metrics.length > 0;
      
      console.log(`${index + 1}. ${report.user.email} - ${hoursAgo}h ago`);
      console.log(`   📄 File: ${report.objectKey}`);
      console.log(`   🤖 AI Extraction: ${hasExtractedJson ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`   📊 Metrics: ${hasMetrics ? `✅ ${report.metrics.length} extracted` : '❌ NONE'}`);
      console.log(`   📅 Report Date: ${report.reportDate || 'Not set'}`);
      console.log('');
    });

    // Analyze extraction success rate over time
    console.log('📈 EXTRACTION SUCCESS RATE ANALYSIS');
    console.log('-----------------------------------');
    
    const last24h = recentReports.filter(r => 
      (Date.now() - r.createdAt.getTime()) < (24 * 60 * 60 * 1000)
    );
    const last48h = recentReports.filter(r => 
      (Date.now() - r.createdAt.getTime()) < (48 * 60 * 60 * 1000)
    );
    const older = recentReports.filter(r => 
      (Date.now() - r.createdAt.getTime()) >= (48 * 60 * 60 * 1000)
    );

    function analyzeGroup(reports, label) {
      const withExtraction = reports.filter(r => !!r.extractedJson).length;
      const withMetrics = reports.filter(r => r.metrics.length > 0).length;
      const total = reports.length;
      
      if (total === 0) {
        console.log(`${label}: No reports`);
        return;
      }
      
      const extractionRate = Math.round((withExtraction / total) * 100);
      const metricsRate = Math.round((withMetrics / total) * 100);
      
      console.log(`${label}: ${total} reports`);
      console.log(`  🤖 AI Extraction: ${withExtraction}/${total} (${extractionRate}%)`);
      console.log(`  📊 Metrics: ${withMetrics}/${total} (${metricsRate}%)`);
    }

    analyzeGroup(last24h, 'Last 24 hours');
    analyzeGroup(last48h.filter(r => !last24h.includes(r)), '24-48 hours ago');
    analyzeGroup(older, 'Older than 48h');

    // Check for pattern in failures
    console.log('\n🔍 FAILURE PATTERN ANALYSIS');
    console.log('---------------------------');
    
    const failedReports = recentReports.filter(r => !r.extractedJson);
    const successfulReports = recentReports.filter(r => !!r.extractedJson);
    
    console.log(`Failed extractions: ${failedReports.length}`);
    console.log(`Successful extractions: ${successfulReports.length}`);
    
    if (failedReports.length > 0) {
      console.log('\n❌ FAILED REPORTS:');
      failedReports.forEach(report => {
        const hoursAgo = Math.round((Date.now() - report.createdAt.getTime()) / (1000 * 60 * 60));
        console.log(`   - ${report.objectKey} (${hoursAgo}h ago)`);
        console.log(`     User: ${report.user.email}`);
        console.log(`     Metrics: ${report.metrics.length > 0 ? 'Manual extraction worked' : 'No metrics at all'}`);
      });
    }

    // Check if there's a specific time when failures started
    if (failedReports.length > 0 && successfulReports.length > 0) {
      const lastSuccessTime = Math.max(...successfulReports.map(r => r.createdAt.getTime()));
      const firstFailureTime = Math.min(...failedReports.map(r => r.createdAt.getTime()));
      
      console.log('\n⏰ TIMELINE ANALYSIS:');
      console.log(`Last successful extraction: ${new Date(lastSuccessTime).toLocaleString()}`);
      console.log(`First failed extraction: ${new Date(firstFailureTime).toLocaleString()}`);
      
      if (firstFailureTime > lastSuccessTime) {
        const hoursBetween = Math.round((firstFailureTime - lastSuccessTime) / (1000 * 60 * 60));
        console.log(`🚨 EXTRACTION BROKE ${hoursBetween} hours ago!`);
      }
    }

    // Check your specific recent upload
    console.log('\n🎯 YOUR RECENT UPLOAD ANALYSIS');
    console.log('------------------------------');
    
    const yourRecentReport = recentReports.find(r => 
      r.user.email === 'vikashgd@gmail.com' && 
      (Date.now() - r.createdAt.getTime()) < (2 * 60 * 60 * 1000) // Last 2 hours
    );

    if (yourRecentReport) {
      console.log(`📄 File: ${yourRecentReport.objectKey}`);
      console.log(`🕐 Uploaded: ${yourRecentReport.createdAt.toLocaleString()}`);
      console.log(`🤖 AI Extraction: ${yourRecentReport.extractedJson ? 'SUCCESS' : 'FAILED'}`);
      console.log(`📊 Metrics: ${yourRecentReport.metrics.length} extracted`);
      
      if (!yourRecentReport.extractedJson) {
        console.log('\n❌ YOUR UPLOAD FAILED AI EXTRACTION');
        console.log('This confirms the AI extraction pipeline is broken.');
        
        if (yourRecentReport.metrics.length > 0) {
          console.log('✅ But manual/fallback extraction worked');
          console.log('Your data is still usable, just missing AI insights');
        }
      }
    } else {
      console.log('No recent upload found for your account in last 2 hours');
    }

    // Recommendations
    console.log('\n🛠️  DIAGNOSIS & RECOMMENDATIONS');
    console.log('===============================');
    
    const recentFailureRate = last24h.length > 0 ? 
      (last24h.filter(r => !r.extractedJson).length / last24h.length) * 100 : 0;
    
    if (recentFailureRate > 50) {
      console.log('🚨 CRITICAL: AI extraction is mostly failing');
      console.log('\nPOSSIBLE CAUSES:');
      console.log('1. Recent code changes broke the extraction pipeline');
      console.log('2. AI service (OpenAI/Claude) API issues');
      console.log('3. PDF processing library issues');
      console.log('4. Network connectivity problems');
      console.log('5. Environment variable changes');
      
      console.log('\nIMMEDIATE ACTIONS:');
      console.log('1. Check recent git commits for extraction-related changes');
      console.log('2. Verify AI service API keys are working');
      console.log('3. Test PDF processing manually');
      console.log('4. Check server logs for extraction errors');
      
      if (yourRecentReport && yourRecentReport.metrics.length > 0) {
        console.log('\n✅ GOOD NEWS: Your data is still on dashboard');
        console.log('The manual extraction fallback worked, so your project is still functional');
      }
    } else if (recentFailureRate > 0) {
      console.log('⚠️  WARNING: Some AI extractions failing');
      console.log('This might be intermittent issues, monitor closely');
    } else {
      console.log('✅ AI extraction appears to be working normally');
      console.log('The issue might be specific to your recent upload');
    }

  } catch (error) {
    console.error('❌ Investigation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run investigation
investigateAIExtractionFailure().catch(console.error);